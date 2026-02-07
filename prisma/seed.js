require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting database seed...')

  // Clear existing data
  await prisma.moduleEnrollment.deleteMany()
  await prisma.analogySet.deleteMany()
  await prisma.module.deleteMany()
  await prisma.user.deleteMany()
  console.log('Cleared existing records')

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      role: 'ADMIN'
    }
  })

  const lecturerUser = await prisma.user.create({
    data: {
      email: 'lecturer@example.com',
      role: 'LECTURER'
    }
  })

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@example.com',
      studentNumber: 'S1234567',
      role: 'STUDENT'
    }
  })

  const moduleCsc7058 = await prisma.module.create({
    data: {
      code: 'CSC7058',
      name: 'Individual Software Development Project',
      description: 'Project-based module for software development practice.',
      lecturerId: lecturerUser.id
    }
  })

  const moduleCsc7084 = await prisma.module.create({
    data: {
      code: 'CSC7084',
      name: 'Web Development',
      description: 'Designing and building modern web applications.',
      lecturerId: lecturerUser.id
    }
  })

  const moduleCsc7082 = await prisma.module.create({
    data: {
      code: 'CSC7082',
      name: 'Databases',
      description: 'Relational data modelling and SQL foundations.',
      lecturerId: lecturerUser.id
    }
  })

  await prisma.moduleEnrollment.createMany({
    data: [
      {
        userId: studentUser.id,
        moduleId: moduleCsc7058.id,
        status: 'ACTIVE'
      },
      {
        userId: studentUser.id,
        moduleId: moduleCsc7084.id,
        status: 'ACTIVE'
      },
      {
        userId: studentUser.id,
        moduleId: moduleCsc7082.id,
        status: 'INVITED'
      }
    ]
  })

  // Sample data for AnalogySet
  const sampleAnalogySet1 = await prisma.analogySet.create({
    data: {
      status: 'ready',
      ownerId: lecturerUser.id,
      title: 'Week 3 - Microservices Architecture',
      source: 'pasted text',
      sourceText: 'Microservices architecture is a design pattern where applications are built as a collection of small, independent services.',
      moduleId: moduleCsc7058.id,
      topicsJson: {
        topics: [
          {
            topic: 'Microservices architecture',
            analogy: 'Think of microservices as a fleet of food trucks rather than a single restaurant. Each food truck (service) specializes in one type of food and can operate independently, move to different locations, and be replaced without affecting the others.'
          }
        ]
      }
    }
  })

  const sampleAnalogySet2 = await prisma.analogySet.create({
    data: {
      status: 'ready',
      ownerId: lecturerUser.id,
      title: 'Week 5 - HTTP & REST APIs',
      source: 'lecture slides',
      sourceText: 'HTTP is the foundation of data communication on the web. REST APIs use HTTP methods to perform CRUD operations.',
      moduleId: moduleCsc7084.id,
      topicsJson: {
        topics: [
          {
            topic: 'HTTP requests',
            analogy: 'HTTP requests are like sending letters through the postal service. You write a letter (request body), put it in an envelope with an address (URL), add a stamp (headers), and the postal service delivers it. You might get a letter back (response) confirming receipt or providing the information you requested.'
          },
          {
            topic: 'REST API endpoints',
            analogy: 'REST API endpoints are like specific service windows at a government office. The /users window handles all user-related requests, /orders handles orders, etc. Each window knows exactly what forms (data) it accepts and what information it can provide back.'
          }
        ]
      }
    }
  })

  const sampleAnalogySet3 = await prisma.analogySet.create({
    data: {
      status: 'ready',
      ownerId: lecturerUser.id,
      title: 'Week 8 - Database Indexing',
      source: 'textbook chapter',
      sourceText: 'Database indexes are data structures that improve the speed of data retrieval operations on a database table.',
      moduleId: moduleCsc7082.id,
      topicsJson: {
        topics: [
          {
            topic: 'Database indexes',
            analogy: 'A database index is like the index at the back of a textbook. Instead of reading every page to find information about "PostgreSQL", you look it up in the index which tells you exactly which pages to turn to. This saves enormous amounts of time when searching through large amounts of data.'
          },
          {
            topic: 'Primary keys',
            analogy: 'A primary key is like a unique student ID number. No two students can have the same ID, and it\'s the fastest way to look up a specific student\'s records. Just like you wouldn\'t use someone\'s name (which might be duplicated) as their primary identifier in a school system.'
          }
        ]
      }
    }
  })

  const sampleAnalogySet4 = await prisma.analogySet.create({
    data: {
      status: 'processing',
      ownerId: lecturerUser.id,
      title: 'Week 10 - Git Version Control',
      source: 'uploaded slides',
      sourceText: 'Git is a distributed version control system for tracking changes in source code during software development.',
      moduleId: moduleCsc7058.id
    }
  })

  const sampleAnalogySet5 = await prisma.analogySet.create({
    data: {
      status: 'failed',
      ownerId: lecturerUser.id,
      title: 'Week 12 - Machine Learning Basics',
      source: 'pasted text',
      sourceText: 'Invalid input that could not be processed',
      errorMessage: 'Failed to generate analogies: Invalid topic format',
      moduleId: moduleCsc7084.id
    }
  })

  console.log('Created sample users:')
  console.log(`  - ${adminUser.email} (${adminUser.role})`)
  console.log(`  - ${lecturerUser.email} (${lecturerUser.role})`)
  console.log(`  - ${studentUser.email} (${studentUser.role})`)
  console.log('Created sample modules:')
  console.log(`  - ${moduleCsc7058.code} (${moduleCsc7058.name})`)
  console.log(`  - ${moduleCsc7084.code} (${moduleCsc7084.name})`)
  console.log(`  - ${moduleCsc7082.code} (${moduleCsc7082.name})`)
  console.log('Created sample AnalogySet records:')
  console.log(`  - ${sampleAnalogySet1.title} (${sampleAnalogySet1.status})`)
  console.log(`  - ${sampleAnalogySet2.title} (${sampleAnalogySet2.status})`)
  console.log(`  - ${sampleAnalogySet3.title} (${sampleAnalogySet3.status})`)
  console.log(`  - ${sampleAnalogySet4.title} (${sampleAnalogySet4.status})`)
  console.log(`  - ${sampleAnalogySet5.title} (${sampleAnalogySet5.status})`)

  console.log('\nSeed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
