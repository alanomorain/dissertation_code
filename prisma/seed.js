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

  const moduleCsc7058 = await prisma.module.create({
    data: {
      code: 'CSC7058',
      name: 'Individual Software Development Project',
      description: 'Project-based module for software development practice.',
      lecturerId: lecturerUser.id,
    },
  })

  const moduleCsc7084 = await prisma.module.create({
    data: {
      code: 'CSC7084',
      name: 'Web Development',
      description: 'Designing and building modern web applications.',
      lecturerId: lecturerUser.id,
    },
  })

  const moduleCsc7082 = await prisma.module.create({
    data: {
      code: 'CSC7082',
      name: 'Databases',
      description: 'Relational data modelling and SQL foundations.',
      lecturerId: lecturerUser.id,
    },
  })

  await prisma.moduleEnrollment.createMany({
    data: [
      { userId: studentA.id, moduleId: moduleCsc7058.id, status: 'ACTIVE' },
      { userId: studentA.id, moduleId: moduleCsc7084.id, status: 'ACTIVE' },
      { userId: studentA.id, moduleId: moduleCsc7082.id, status: 'INVITED' },
      { userId: studentB.id, moduleId: moduleCsc7058.id, status: 'ACTIVE' },
      { userId: studentB.id, moduleId: moduleCsc7082.id, status: 'ACTIVE' },
    ],
  })

  const sampleAnalogySet1 = await prisma.analogySet.create({
    data: {
      status: 'ready',
      reviewStatus: 'APPROVED',
      approvedAt: new Date(),
      ownerId: lecturerUser.id,
      title: 'Week 3 - Microservices Architecture',
      source: 'pasted text',
      sourceText: 'Microservices architecture is a design pattern where applications are built as a collection of small, independent services.',
      moduleId: moduleCsc7058.id,
      topicsJson: {
        topics: [
          {
            topic: 'Microservices architecture',
            analogy: 'Think of microservices as a fleet of food trucks rather than a single restaurant.',
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
      title: 'Week 5 - HTTP & REST APIs',
      source: 'lecture slides',
      sourceText: 'HTTP is the foundation of data communication on the web. REST APIs use HTTP methods to perform CRUD operations.',
      moduleId: moduleCsc7084.id,
      topicsJson: {
        topics: [
          { topic: 'HTTP requests', analogy: 'HTTP requests are like sending letters through the postal service.' },
          { topic: 'REST API endpoints', analogy: 'REST API endpoints are like specific service windows at a government office.' },
        ],
      },
    },
  })

  const sampleAnalogySet3 = await prisma.analogySet.create({
    data: {
      status: 'ready',
      reviewStatus: 'DRAFT',
      ownerId: lecturerUser.id,
      title: 'Week 8 - Database Indexing',
      source: 'textbook chapter',
      sourceText: 'Database indexes improve speed of data retrieval operations.',
      moduleId: moduleCsc7082.id,
      topicsJson: {
        topics: [
          { topic: 'Database indexes', analogy: 'A database index is like the index at the back of a textbook.' },
          { topic: 'Primary keys', analogy: 'A primary key is like a unique student ID number.' },
        ],
      },
    },
  })

  await prisma.analogySet.create({
    data: {
      status: 'processing',
      ownerId: lecturerUser.id,
      title: 'Week 10 - Git Version Control',
      source: 'uploaded slides',
      sourceText: 'Git is a distributed version control system for tracking changes in source code during software development.',
      moduleId: moduleCsc7058.id,
    },
  })

  await prisma.analogySet.create({
    data: {
      status: 'failed',
      ownerId: lecturerUser.id,
      title: 'Week 12 - Machine Learning Basics',
      source: 'pasted text',
      sourceText: 'Invalid input that could not be processed',
      errorMessage: 'Failed to generate analogies: Invalid topic format',
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
    ],
  })

  const quizA = await createQuizWithQuestions({
    title: 'Microservices Patterns Check-in',
    status: 'PUBLISHED',
    moduleId: moduleCsc7058.id,
    ownerId: lecturerUser.id,
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    maxAttempts: 2,
    questions: [
      {
        prompt: 'Which statement best describes microservices?',
        type: 'MCQ',
        difficulty: 'MEDIUM',
        options: [
          { text: 'Independent services that communicate via APIs.', isCorrect: true },
          { text: 'A single monolithic deployment unit.', isCorrect: false },
          { text: 'Only front-end components.', isCorrect: false },
        ],
      },
      {
        prompt: 'Which is a common trade-off of microservices?',
        type: 'MCQ',
        difficulty: 'HARD',
        options: [
          { text: 'Operational complexity increases.', isCorrect: true },
          { text: 'No need for monitoring.', isCorrect: false },
          { text: 'Databases are no longer required.', isCorrect: false },
        ],
      },
    ],
  })

  const quizB = await createQuizWithQuestions({
    title: 'Database Indexing Fundamentals',
    status: 'PUBLISHED',
    moduleId: moduleCsc7082.id,
    ownerId: lecturerUser.id,
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    maxAttempts: 1,
    questions: [
      {
        prompt: 'What is the main purpose of an index?',
        type: 'MCQ',
        difficulty: 'EASY',
        options: [
          { text: 'Speed up lookup queries.', isCorrect: true },
          { text: 'Encrypt all records.', isCorrect: false },
          { text: 'Increase table width.', isCorrect: false },
        ],
      },
      {
        prompt: 'In your own words, explain a drawback of too many indexes.',
        type: 'SHORT',
        difficulty: 'MEDIUM',
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

  const attemptA = await prisma.quizAttempt.create({
    data: {
      quizId: quizA.id,
      studentId: studentA.id,
      status: 'SUBMITTED',
      score: 100,
      submittedAt: new Date(),
    },
  })

  await prisma.quizResponse.createMany({
    data: quizA.questions
      .filter((q) => q.type === 'MCQ')
      .map((q) => ({
        attemptId: attemptA.id,
        questionId: q.id,
        selectedOptionId: q.options.find((opt) => opt.isCorrect)?.id,
        isCorrect: true,
      })),
  })

  const attemptB = await prisma.quizAttempt.create({
    data: {
      quizId: quizB.id,
      studentId: studentA.id,
      status: 'SUBMITTED',
      score: 50,
      submittedAt: new Date(),
    },
  })

  const indexQ1 = quizB.questions[0]
  const indexQ2 = quizB.questions[1]

  await prisma.quizResponse.create({
    data: {
      attemptId: attemptB.id,
      questionId: indexQ1.id,
      selectedOptionId: indexQ1.options.find((opt) => opt.isCorrect)?.id,
      isCorrect: true,
    },
  })

  await prisma.quizResponse.create({
    data: {
      attemptId: attemptB.id,
      questionId: indexQ2.id,
      textAnswer: 'Too many indexes can slow down writes because each index must be updated.',
      isCorrect: false,
    },
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
