import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create demo users
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@favsetter.com' },
    update: {},
    create: {
      email: 'admin@favsetter.com',
      name: 'Admin User',
      password: hashedPassword,
    },
  });

  // Create demo tags
  const demoTags = [
    { name: 'development', color: '#3B82F6' },
    { name: 'documentation', color: '#10B981' },
    { name: 'music', color: '#F59E0B' },
    { name: 'tutorial', color: '#8B5CF6' },
    { name: 'framework', color: '#EF4444' },
    { name: 'css', color: '#06B6D4' },
    { name: 'database', color: '#84CC16' },
    { name: 'ui', color: '#EC4899' },
  ];

  const createdTags = [];
  for (const tagData of demoTags) {
    const tag = await prisma.tag.create({
      data: {
        ...tagData,
        userId: demoUser.id,
      },
    });
    createdTags.push(tag);
  }

  // Create demo favorites with tags
  const demoFavorites = [
    {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      domain: 'youtube.com',
      title: 'Rick Astley - Never Gonna Give You Up',
      rating: 5,
      tags: ['music'],
    },
    {
      url: 'https://github.com/vercel/next.js',
      domain: 'github.com',
      title: 'Next.js by Vercel - The React Framework',
      rating: 5,
      tags: ['development', 'framework'],
    },
    {
      url: 'https://tailwindcss.com/docs',
      domain: 'tailwindcss.com',
      title: 'Tailwind CSS Documentation',
      rating: 4,
      tags: ['documentation', 'css', 'development'],
    },
    {
      url: 'https://www.prisma.io/docs',
      domain: 'prisma.io',
      title: 'Prisma Documentation',
      rating: 5,
      tags: ['documentation', 'database', 'development'],
    },
    {
      url: 'https://ui.shadcn.com/',
      domain: 'ui.shadcn.com',
      title: 'shadcn/ui',
      description: 'Beautifully designed components built with Radix UI and Tailwind CSS.',
      rating: 5,
      tags: ['ui', 'development', 'framework'],
    },
  ];

  for (const favoriteData of demoFavorites) {
    const { tags, ...favorite } = favoriteData;
    
    const createdFavorite = await prisma.favorite.create({
      data: {
        ...favorite,
        userId: demoUser.id,
      },
    });

    // Add tags to favorite
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tag = createdTags.find(t => t.name === tagName);
        if (tag) {
          await prisma.favoriteTag.create({
            data: {
              favoriteId: createdFavorite.id,
              tagId: tag.id,
            },
          });
        }
      }
    }
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`👤 Demo user: demo@example.com / password123`);
  console.log(`👤 Admin user: admin@favsetter.com / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 