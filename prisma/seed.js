require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const { randomBytes, scryptSync } = require('node:crypto')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

async function createQuizWithQuestions({
  title,
  status,
  moduleId,
  ownerId,
  dueAt,
  publishedAt,
  maxAttempts,
  questions,
}) {
  return prisma.quiz.create({
    data: {
      title,
      status,
      moduleId,
      ownerId,
      visibility: 'ENROLLED',
      maxAttempts,
      dueAt,
      publishedAt: status === 'PUBLISHED' ? (publishedAt || new Date()) : null,
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

async function createSubmittedAttempt({ quiz, studentId, mcqAnswers = [], shortAnswers = [] }) {
  const allAnswerMarks = [...mcqAnswers, ...shortAnswers]
  const gradedAnswerCount = allAnswerMarks.length
  const correctCount = allAnswerMarks.filter((answer) => !!answer.isCorrect).length
  const computedScore = gradedAnswerCount > 0
    ? Math.round((correctCount / gradedAnswerCount) * 100)
    : 0

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      studentId,
      status: 'SUBMITTED',
      score: computedScore,
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

function mcqQuestion(prompt, difficulty, correct, wrongA, wrongB) {
  return {
    prompt,
    type: 'MCQ',
    difficulty,
    options: [
      { text: correct, isCorrect: true },
      { text: wrongA, isCorrect: false },
      { text: wrongB, isCorrect: false },
    ],
  }
}

async function main() {
  console.log('Starting database seed...')
  const lecturerPassword = process.env.SEED_LECTURER_PASSWORD || 'LecturerPass123!'
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'StudentPass123!'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPass123!'

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
    data: { email: 'admin@example.com', role: 'ADMIN', passwordHash: hashPassword(adminPassword) },
  })

  const lecturerUser = await prisma.user.create({
    data: { email: 'lecturer@example.com', role: 'LECTURER', passwordHash: hashPassword(lecturerPassword) },
  })

  const studentA = await prisma.user.create({
    data: { email: 'student@example.com', studentNumber: 'S1234567', role: 'STUDENT', passwordHash: hashPassword(studentPassword) },
  })

  const studentB = await prisma.user.create({
    data: { email: 'student2@example.com', studentNumber: 'S1234568', role: 'STUDENT', passwordHash: hashPassword(studentPassword) },
  })

  const studentC = await prisma.user.create({
    data: { email: 'student3@example.com', studentNumber: 'S1234569', role: 'STUDENT', passwordHash: hashPassword(studentPassword) },
  })

  const studentD = await prisma.user.create({
    data: { email: 'student4@example.com', studentNumber: 'S1234570', role: 'STUDENT', passwordHash: hashPassword(studentPassword) },
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

  const moduleCsc3065 = await prisma.module.create({
    data: {
      code: 'CSC3065',
      name: 'Cloud Computing',
      description: 'Core cloud computing concepts including service models, virtualization, and scalable distributed systems.',
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
      { userId: studentB.id, moduleId: moduleCsc3065.id, status: 'ACTIVE' },
      { userId: studentC.id, moduleId: moduleCsc7058.id, status: 'ACTIVE' },
      { userId: studentC.id, moduleId: moduleCsc7084.id, status: 'ACTIVE' },
      { userId: studentC.id, moduleId: moduleCsc3065.id, status: 'ACTIVE' },
      { userId: studentD.id, moduleId: moduleCsc7084.id, status: 'ACTIVE' },
      { userId: studentD.id, moduleId: moduleCsc7082.id, status: 'ACTIVE' },
      { userId: studentD.id, moduleId: moduleCsc3065.id, status: 'ACTIVE' },
      { userId: studentA.id, moduleId: moduleCsc3065.id, status: 'ACTIVE' },
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

  const quizBlueprints = [
    {
      title: 'Cloud-Native Microservices Readiness Quiz',
      status: 'PUBLISHED',
      moduleId: moduleCsc7058.id,
      dueInDays: -2,
      publishedOffsetDays: -10,
      maxAttempts: 2,
      questions: [
        mcqQuestion('Which statement best describes a cloud-native microservice?', 'MEDIUM', 'An independently deployable service that communicates through APIs.', 'A single monolithic deployment unit.', 'Only front-end components.'),
        mcqQuestion('Which is a common trade-off when moving to microservices in the cloud?', 'HARD', 'Operational complexity increases.', 'No need for monitoring.', 'Databases are no longer required.'),
        mcqQuestion('What cloud platform feature helps microservices recover quickly from instance failure?', 'MEDIUM', 'Health checks with automatic replacement.', 'Hard-coding service IP addresses.', 'Manual nightly deployments only.'),
        mcqQuestion('Why are service meshes often introduced in cloud-native systems?', 'HARD', 'To handle service-to-service traffic, security, and observability consistently.', 'To replace all business logic.', 'To avoid using containers.'),
        mcqQuestion('What deployment approach limits user impact during release?', 'MEDIUM', 'Canary deployment with monitoring.', 'Stopping all pods before redeploying.', 'Deploying directly to production without tests.'),
      ],
    },
    {
      title: 'Cloud Data Reliability Fundamentals',
      status: 'PUBLISHED',
      moduleId: moduleCsc7082.id,
      dueInDays: 7,
      publishedOffsetDays: -3,
      maxAttempts: 1,
      questions: [
        mcqQuestion('Why is multi-region replication used in cloud databases?', 'EASY', 'To improve resilience and reduce regional outage impact.', 'To eliminate the need for backups.', 'To avoid all consistency trade-offs.'),
        { prompt: 'In your own words, explain one trade-off of synchronous replication across regions.', type: 'SHORT', difficulty: 'MEDIUM' },
        mcqQuestion('What is the main purpose of automated cloud backups?', 'EASY', 'To restore data after accidental deletion or corruption.', 'To make indexes unnecessary.', 'To remove latency between regions.'),
        mcqQuestion('Which pattern improves read performance for globally distributed users?', 'MEDIUM', 'Read replicas close to user regions.', 'A single write node with no replicas.', 'Disabling caching everywhere.'),
        mcqQuestion('What does eventual consistency usually imply?', 'MEDIUM', 'Recent writes may take time to appear everywhere.', 'All regions always show data instantly.', 'No conflict resolution is ever required.'),
      ],
    },
    {
      title: 'DevOps Automation & Observability Quiz',
      status: 'PUBLISHED',
      moduleId: moduleCsc7084.id,
      dueInDays: 5,
      publishedOffsetDays: -4,
      maxAttempts: 2,
      questions: [
        mcqQuestion('What is the primary benefit of CI/CD in cloud projects?', 'EASY', 'Faster and safer delivery of changes.', 'No need for testing.', 'Guaranteed zero downtime with no planning.'),
        mcqQuestion('Which signal helps detect application performance issues earliest?', 'MEDIUM', 'Latency metrics and distributed traces.', 'Code comments only.', 'Version control commit count alone.'),
        mcqQuestion('Why are infrastructure pipelines commonly version-controlled?', 'MEDIUM', 'To audit and review infrastructure changes safely.', 'To prevent rollback options.', 'To avoid any team collaboration.'),
        mcqQuestion('What is the role of alerting thresholds in cloud operations?', 'MEDIUM', 'Notify engineers when service health deviates from targets.', 'Guarantee all incidents are false positives.', 'Replace logging systems completely.'),
        mcqQuestion('Which practice strengthens deployment confidence?', 'HARD', 'Progressive rollout plus automated smoke tests.', 'Skipping staging environments.', 'Disabling observability during releases.'),
      ],
    },
    {
      title: 'Cloud API Security Foundations (Draft)',
      status: 'DRAFT',
      moduleId: moduleCsc7084.id,
      dueInDays: null,
      publishedOffsetDays: null,
      maxAttempts: 1,
      questions: [
        mcqQuestion('Which HTTP verb is usually used for resource creation?', 'EASY', 'POST', 'GET', 'DELETE'),
        mcqQuestion('What is the purpose of API rate limiting?', 'MEDIUM', 'Protect APIs from abuse and traffic spikes.', 'Increase payload size limits.', 'Replace identity checks.'),
        mcqQuestion('Why should API tokens be rotated?', 'MEDIUM', 'To reduce risk if a credential is exposed.', 'To increase request latency.', 'To disable monitoring tools.'),
        mcqQuestion('Which mechanism is common for API authentication in cloud systems?', 'EASY', 'OAuth 2.0 or JWT-based bearer tokens.', 'Publicly shared root passwords.', 'IP addresses embedded in source code.'),
        mcqQuestion('What should an API gateway typically enforce?', 'MEDIUM', 'Authentication, authorization, and request policies.', 'Random schema changes.', 'Direct database writes from the client.'),
      ],
    },
  ]

  const additionalPublishedQuizzes = [
    'Kubernetes Scheduling and Resource Limits',
    'Serverless Event Processing Essentials',
    'Cloud Cost Optimization Basics',
    'Infrastructure as Code Workflow Quiz',
    'Distributed Caching and CDN Fundamentals',
    'Cloud Networking and VPC Security',
    'Incident Response in Cloud Operations',
    'Container Security and Image Hardening',
    'SRE Reliability Targets and Error Budgets',
    'Cloud Storage Classes and Lifecycle Policies',
    'Identity and Access Management in the Cloud',
  ]

  additionalPublishedQuizzes.forEach((title, idx) => {
    const moduleId = [moduleCsc7058.id, moduleCsc7084.id, moduleCsc7082.id][idx % 3]
    quizBlueprints.push({
      title,
      status: 'PUBLISHED',
      moduleId,
      dueInDays: 6 + idx,
      publishedOffsetDays: idx % 4 === 0 ? 2 : -(idx + 1),
      maxAttempts: idx % 2 === 0 ? 2 : 1,
      questions: [
        mcqQuestion(`(${title}) Which cloud practice best supports resilience?`, 'MEDIUM', 'Redundancy across zones with health checks.', 'A single instance with manual restarts.', 'No monitoring and no backups.'),
        mcqQuestion(`(${title}) What is a common reason to automate deployments?`, 'EASY', 'Reduce human error and improve repeatability.', 'Increase manual change approvals per release.', 'Prevent all test execution.'),
        mcqQuestion(`(${title}) Which metric is useful for user experience tracking?`, 'MEDIUM', 'P95 request latency.', 'Number of README files.', 'Total lines of YAML.'),
        mcqQuestion(`(${title}) Why is least-privilege access recommended?`, 'MEDIUM', 'It minimizes blast radius if credentials are compromised.', 'It guarantees zero security incidents.', 'It removes the need for audits.'),
        { prompt: `(${title}) Briefly describe one cloud trade-off this topic introduces.`, type: 'SHORT', difficulty: 'HARD' },
      ],
    })
  })

  const createdQuizzes = []
  for (const blueprint of quizBlueprints) {
    createdQuizzes.push(
      await createQuizWithQuestions({
        title: blueprint.title,
        status: blueprint.status,
        moduleId: blueprint.moduleId,
        ownerId: lecturerUser.id,
        dueAt: blueprint.dueInDays === null ? null : new Date(Date.now() + 1000 * 60 * 60 * 24 * blueprint.dueInDays),
        publishedAt:
          blueprint.status !== 'PUBLISHED'
            ? null
            : blueprint.publishedOffsetDays === null || blueprint.publishedOffsetDays === undefined
              ? new Date()
              : new Date(Date.now() + 1000 * 60 * 60 * 24 * blueprint.publishedOffsetDays),
        maxAttempts: blueprint.maxAttempts,
        questions: blueprint.questions,
      }),
    )
  }

  const quizA = createdQuizzes[0]
  const quizB = createdQuizzes[1]
  const quizC = createdQuizzes[2]

  await createSubmittedAttempt({
    quiz: quizA,
    studentId: studentA.id,
    mcqAnswers: [
      { questionIndex: 0, selection: 'correct', isCorrect: true },
      { questionIndex: 1, selection: 'correct', isCorrect: true },
      { questionIndex: 2, selection: 'correct', isCorrect: true },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizA,
    studentId: studentB.id,
    mcqAnswers: [
      { questionIndex: 0, selection: 'correct', isCorrect: true },
      { questionIndex: 1, selection: 'wrong', isCorrect: false },
      { questionIndex: 2, selection: 'correct', isCorrect: true },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizA,
    studentId: studentC.id,
    mcqAnswers: [
      { questionIndex: 0, selection: 'wrong', isCorrect: false },
      { questionIndex: 1, selection: 'correct', isCorrect: true },
      { questionIndex: 2, selection: 'wrong', isCorrect: false },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizB,
    studentId: studentA.id,
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
    mcqAnswers: [
      { questionIndex: 0, selection: 'correct', isCorrect: true },
      { questionIndex: 1, selection: 'correct', isCorrect: true },
    ],
  })

  await createSubmittedAttempt({
    quiz: quizC,
    studentId: studentD.id,
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
    if (e?.code === 'P2022') {
      console.error('Schema mismatch detected (missing DB column).')
      console.error('Run `npm run db:push` to sync your database schema, then retry `npm run db:seed`.')
    }
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
