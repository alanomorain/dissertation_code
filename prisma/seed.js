const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Clear existing data
  await prisma.analogySet.deleteMany()
  console.log('Cleared existing AnalogySet records')

  // Sample data for AnalogySet
  const sampleAnalogySet1 = await prisma.analogySet.create({
    data: {
      status: 'ready',
      ownerRole: 'lecturer',
      title: 'Week 3 - Microservices Architecture',
      source: 'pasted text',
      sourceText: 'Microservices architecture is a design pattern where applications are built as a collection of small, independent services.',
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
      ownerRole: 'lecturer',
      title: 'Week 5 - HTTP & REST APIs',
      source: 'lecture slides',
      sourceText: 'HTTP is the foundation of data communication on the web. REST APIs use HTTP methods to perform CRUD operations.',
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
      ownerRole: 'lecturer',
      title: 'Week 8 - Database Indexing',
      source: 'textbook chapter',
      sourceText: 'Database indexes are data structures that improve the speed of data retrieval operations on a database table.',
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
      ownerRole: 'lecturer',
      title: 'Week 10 - Git Version Control',
      source: 'uploaded slides',
      sourceText: 'Git is a distributed version control system for tracking changes in source code during software development.'
    }
  })

  const sampleAnalogySet5 = await prisma.analogySet.create({
    data: {
      status: 'failed',
      ownerRole: 'lecturer',
      title: 'Week 12 - Machine Learning Basics',
      source: 'pasted text',
      sourceText: 'Invalid input that could not be processed',
      errorMessage: 'Failed to generate analogies: Invalid topic format'
    }
  })

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
