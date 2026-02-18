require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function createQuizWithQuestions({ title, status, moduleId, ownerId, dueAt, maxAttempts, questions }) {
  return prisma.quiz.create({
    data: {
      title,
      status,
      moduleId,
      ownerId,
      visibility: 'ENROLLED',
      maxAttempts,
      dueAt,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      questions: {
        create: questions.map((q, index) => ({
          prompt: q.prompt,
          type: q.type,
          difficulty: q.difficulty,
          orderIndex: index,
          options: q.options
            ? {
                create: q.options.map((option, optionIndex) => ({
                  text: option.text,
                  isCorrect: !!option.isCorrect,
                  orderIndex: optionIndex,
                })),
              }
            : undefined,
        })),
      },
    },
    include: {
      questions: {
        include: { options: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  })
}

async function createSubmittedAttempt({ quiz, studentId, score, mcqAnswers = [], shortAnswers = [] }) {
  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      studentId,
      status: 'SUBMITTED',
      score,
      submittedAt: new Date(),
    },
  })

  for (const answer of mcqAnswers) {
    const question = quiz.questions[answer.questionIndex]
    const selectedOption =
      answer.selection === 'correct'
        ? question.options.find((option) => option.isCorrect)
        : question.options.find((option) => !option.isCorrect)

    await prisma.quizResponse.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        selectedOptionId: selectedOption?.id,
        isCorrect: !!answer.isCorrect,
      },
    })
  }

  for (const answer of shortAnswers) {
    const question = quiz.questions[answer.questionIndex]
    await prisma.quizResponse.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        textAnswer: answer.text,
        isCorrect: answer.isCorrect,
      },
    })
  }

  return attempt
}

async function main() {
  console.log('Starting database seed...')

  await prisma.quizResponse.deleteMany()
  await prisma.quizAttempt.deleteMany()
  await prisma.quizOption.deleteMany()
  await prisma.quizQuestion.deleteMany()
  await prisma.quiz.deleteMany()
  await prisma.analogyInteraction.deleteMany()
  await prisma.moduleEnrollment.deleteMany()
  await prisma.analogySet.deleteMany()
  await prisma.module.deleteMany()
  await prisma.user.deleteMany()
  console.log('Cleared existing records')

  const adminUser = await prisma.user.create({
    data: { email: 'admin@example.com', role: 'ADMIN' },
  })

  const lecturerUser = await prisma.user.create({
    data: { email: 'lecturer@example.com', role: 'LECTURER' },
  })

  const studentA = await prisma.user.create({
    data: { email: 'student@example.com', studentNumber: 'S1234567', role: 'STUDENT' },
  })

  const studentB = await prisma.user.create({
    data: { email: 'student2@example.com', studentNumber: 'S1234568', role: 'STUDENT' },
  })

  const studentC = await prisma.user.create({
    data: { email: 'student3@example.com', studentNumber: 'S1234569', role: 'STUDENT' },
  })

  const studentD = await prisma.user.create({
    data: { email: 'student4@example.com', studentNumber: 'S1234570', role: 'STUDENT' },
  })

  const moduleCsc7058 = await prisma.module.create({
    data: {
      code: 'CSC7058',
      name: 'Cloud-Native Application Development',
      description: 'Designing and deploying scalable services using containers and microservices.',
      lecturerId: lecturerUser.id,
    },
  })

  const moduleCsc7084 = await prisma.module.create({
    data: {
      code: 'CSC7084',
      name: 'Cloud Infrastructure & DevOps',
      description: 'Infrastructure as code, CI/CD pipelines, and observability for cloud systems.',
      lecturerId: lecturerUser.id,
    },
  })

  const moduleCsc7082 = await prisma.module.create({
    data: {
      code: 'CSC7082',
      name: 'Data Platforms for Cloud Computing',
      description: 'Distributed data storage, partitioning, caching, and reliability patterns.',
      lecturerId: lecturerUser.id,
    },
  })

  await prisma.moduleEnrollment.createMany({
    data: [
      { userId: studentA.id, moduleId: moduleCsc7058.id, status: 'ACTIVE' },
      { userId: studentA.id, moduleId: moduleCsc7084.id, status: 'ACTIVE' },
      { userId: studentA.id, moduleId: moduleCsc7082.id, status: 'ACTIVE' },
      { userId: studentB.id, moduleId: moduleCsc7058.id, status: 'ACTIVE' },
      { userId: studentB.id, moduleId: moduleCsc7082.id, status: 'ACTIVE' },
      { userId: studentC.id, moduleId: moduleCsc7058.id, status: 'ACTIVE' },
      { userId: studentC.id, moduleId: moduleCsc7084.id, status: 'ACTIVE' },
      { userId: studentD.id, moduleId: moduleCsc7084.id, status: 'ACTIVE' },
      { userId: studentD.id, moduleId: moduleCsc7082.id, status: 'ACTIVE' },
    ],
  })

  const sampleAnalogySet1 = await prisma.analogySet.create({
    data: {
      status: 'ready',
      reviewStatus: 'APPROVED',
      approvedAt: new Date(),
      ownerId: lecturerUser.id,
      title: 'Week 3 - Autoscaling Microservices on Kubernetes',
      source: 'pasted text',
      sourceText: 'Cloud-native microservices are packaged in containers and can scale horizontally using orchestration platforms like Kubernetes.',
      moduleId: moduleCsc7058.id,
      topicsJson: {
        topics: [
          {
            topic: 'Autoscaling',
            analogy: 'Autoscaling is like opening extra supermarket checkouts when queues get too long.',
          },
        ],
      },
    },
  })

  const sampleAnalogySet2 = await prisma.analogySet.create({
    data: {
      status: 'ready',
      reviewStatus: 'APPROVED',
      approvedAt: new Date(),
      ownerId: lecturerUser.id,
      title: 'Week 5 - Cloud Load Balancers & API Gateways',
      source: 'lecture slides',
      sourceText: 'Cloud load balancers distribute traffic across healthy instances while API gateways enforce authentication, routing, and throttling.',
      moduleId: moduleCsc7084.id,
      topicsJson: {
        topics: [
          { topic: 'Load balancing', analogy: 'A load balancer is like an airport marshal sending aircraft to the shortest available runway queue.' },
          { topic: 'API gateway', analogy: 'An API gateway is like a hotel concierge who checks reservations before directing guests to the right service desk.' },
        ],
      },
    },
  })

  const sampleAnalogySet3 = await prisma.analogySet.create({
    data: {
      status: 'ready',
      reviewStatus: 'DRAFT',
      ownerId: lecturerUser.id,
      title: 'Week 8 - Multi-Region Cloud Databases',
      source: 'textbook chapter',
      sourceText: 'Globally distributed databases replicate data across regions to improve resilience and reduce latency for users worldwide.',
      moduleId: moduleCsc7082.id,
      topicsJson: {
        topics: [
          { topic: 'Multi-region replication', analogy: 'Replicating data across regions is like keeping copies of passports in embassies around the world.' },
          { topic: 'Failover', analogy: 'Failover is like rerouting trains to a backup line when the main track is blocked.' },
        ],
      },
    },
  })

  await prisma.analogySet.create({
    data: {
      status: 'processing',
      ownerId: lecturerUser.id,
      title: 'Week 10 - Terraform State & IaC Workflows',
      source: 'uploaded slides',
      sourceText: 'Infrastructure as code tools such as Terraform let teams version and automate cloud infrastructure provisioning.',
      moduleId: moduleCsc7058.id,
    },
  })

  await prisma.analogySet.create({
    data: {
      status: 'failed',
      ownerId: lecturerUser.id,
      title: 'Week 12 - Serverless Event Streams',
      source: 'pasted text',
      sourceText: 'Invalid input that could not be processed',
      errorMessage: 'Failed to generate analogies: Model output did not include required topic list',
      moduleId: moduleCsc7084.id,
    },
  })

  await prisma.analogyInteraction.createMany({
    data: [
      { analogySetId: sampleAnalogySet1.id, userId: studentA.id, type: 'VIEW' },
      { analogySetId: sampleAnalogySet1.id, userId: studentA.id, type: 'REVISIT' },
      { analogySetId: sampleAnalogySet1.id, userId: studentB.id, type: 'VIEW' },
      { analogySetId: sampleAnalogySet2.id, userId: studentA.id, type: 'VIEW' },
      { analogySetId: sampleAnalogySet3.id, userId: studentB.id, type: 'VIEW' },
      { analogySetId: sampleAnalogySet3.id, userId: studentB.id, type: 'REVISIT' },
      { analogySetId: sampleAnalogySet2.id, userId: studentC.id, type: 'VIEW' },
      { analogySetId: sampleAnalogySet1.id, userId: studentC.id, type: 'VIEW' },
      { analogySetId: sampleAnalogySet2.id, userId: studentD.id, type: 'VIEW' },
      { analogySetId: sampleAnalogySet2.id, userId: studentD.id, type: 'REVISIT' },
    ],
  })

  const quizA = await createQuizWithQuestions({
    title: 'Cloud-Native Microservices Readiness Quiz',
    status: 'PUBLISHED',
    moduleId: moduleCsc7058.id,
    ownerId: lecturerUser.id,
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    maxAttempts: 2,
    questions: [
      {
        prompt: 'Which statement best describes a cloud-native microservice?',
        type: 'MCQ',
        difficulty: 'MEDIUM',
        options: [
          { text: 'An independently deployable service that communicates through APIs.', isCorrect: true },
          { text: 'A single monolithic deployment unit.', isCorrect: false },
          { text: 'Only front-end components.', isCorrect: false },
        ],
      },
      {
        prompt: 'Which is a common trade-off when moving to microservices in the cloud?',
        type: 'MCQ',
        difficulty: 'HARD',
        options: [
          { text: 'Operational complexity increases.', isCorrect: true },
          { text: 'No need for monitoring.', isCorrect: false },
          { text: 'Databases are no longer required.', isCorrect: false },
        ],
      },
      {
        prompt: 'What cloud platform feature helps microservices recover quickly from instance failure?',
        type: 'MCQ',
        difficulty: 'MEDIUM',
        options: [
          { text: 'Health checks with automatic replacement.', isCorrect: true },
          { text: 'Hard-coding service IP addresses.', isCorrect: false },
          { text: 'Manual nightly deployments only.', isCorrect: false },
        ],
      },
    ],
  })

  const quizB = await createQuizWithQuestions({
    title: 'Cloud Data Reliability Fundamentals',
    status: 'PUBLISHED',
    moduleId: moduleCsc7082.id,
    ownerId: lecturerUser.id,
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    maxAttempts: 1,
    questions: [
      {
        prompt: 'Why is multi-region replication used in cloud databases?',
        type: 'MCQ',
        difficulty: 'EASY',
        options: [
          { text: 'To improve resilience and reduce regional outage impact.', isCorrect: true },
          { text: 'To eliminate the need for backups.', isCorrect: false },
          { text: 'To avoid all consistency trade-offs.', isCorrect: false },
        ],
      },
      {
        prompt: 'In your own words, explain one trade-off of synchronous replication across regions.',
        type: 'SHORT',
        difficulty: 'MEDIUM',
      },
    ],
  })

  const quizC = await createQuizWithQuestions({
    title: 'DevOps Automation & Observability Quiz',
    status: 'PUBLISHED',
    moduleId: moduleCsc7084.id,
    ownerId: lecturerUser.id,
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    maxAttempts: 2,
    questions: [
      {
        prompt: 'What is the primary benefit of CI/CD in cloud projects?',
        type: 'MCQ',
        difficulty: 'EASY',
        options: [
          { text: 'Faster and safer delivery of changes.', isCorrect: true },
          { text: 'No need for testing.', isCorrect: false },
          { text: 'Guaranteed zero downtime with no planning.', isCorrect: false },
        ],
      },
      {
        prompt: 'Which signal helps detect application performance issues earliest?',
        type: 'MCQ',
        difficulty: 'MEDIUM',
        options: [
          { text: 'Latency metrics and distributed traces.', isCorrect: true },
          { text: 'Code comments only.', isCorrect: false },
          { text: 'Version control commit count alone.', isCorrect: false },
        ],
      },
    ],
  })

  await createQuizWithQuestions({
    title: 'Web APIs Quiz Draft',
    status: 'DRAFT',
    moduleId: moduleCsc7084.id,
    ownerId: lecturerUser.id,
    dueAt: null,
    maxAttempts: 1,
    questions: [
      {
        prompt: 'Which HTTP verb is usually used for resource creation?',
        type: 'MCQ',
        difficulty: 'EASY',
        options: [
          { text: 'POST', isCorrect: true },
          { text: 'GET', isCorrect: false },
          { text: 'DELETE', isCorrect: false },
        ],
      },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizA,
    studentId: studentA.id,
    score: 100,
    mcqAnswers: [
      { questionIndex: 0, selection: 'correct', isCorrect: true },
      { questionIndex: 1, selection: 'correct', isCorrect: true },
      { questionIndex: 2, selection: 'correct', isCorrect: true },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizA,
    studentId: studentB.id,
    score: 67,
    mcqAnswers: [
      { questionIndex: 0, selection: 'correct', isCorrect: true },
      { questionIndex: 1, selection: 'wrong', isCorrect: false },
      { questionIndex: 2, selection: 'correct', isCorrect: true },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizA,
    studentId: studentC.id,
    score: 33,
    mcqAnswers: [
      { questionIndex: 0, selection: 'wrong', isCorrect: false },
      { questionIndex: 1, selection: 'correct', isCorrect: true },
      { questionIndex: 2, selection: 'wrong', isCorrect: false },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizB,
    studentId: studentA.id,
    score: 90,
    mcqAnswers: [{ questionIndex: 0, selection: 'correct', isCorrect: true }],
    shortAnswers: [
      {
        questionIndex: 1,
        text: 'Synchronous replication improves consistency but can increase write latency between regions.',
        isCorrect: true,
      },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizB,
    studentId: studentD.id,
    score: 40,
    mcqAnswers: [{ questionIndex: 0, selection: 'wrong', isCorrect: false }],
    shortAnswers: [
      {
        questionIndex: 1,
        text: 'Replication means data exists in two places, but updates can take longer to confirm everywhere.',
        isCorrect: true,
      },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizC,
    studentId: studentC.id,
    score: 100,
    mcqAnswers: [
      { questionIndex: 0, selection: 'correct', isCorrect: true },
      { questionIndex: 1, selection: 'correct', isCorrect: true },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizC,
    studentId: studentD.id,
    score: 50,
    mcqAnswers: [
      { questionIndex: 0, selection: 'correct', isCorrect: true },
      { questionIndex: 1, selection: 'wrong', isCorrect: false },
    ],
  })

  console.log('Created sample users, modules, analogies, quiz attempts, and interactions.')
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
