import Redacted from '@/public/screenshots/redacted.jpg';
import BookNook from '@/public/screenshots/book-nook.jpg';
// import VetClinic from '@/public/screenshots/vet-clinic.png';
import StudentNameGenerator from '@/public/screenshots/teacherbuddy.png';
import BubblesGenerator from '@/public/screenshots/bubbles-express.png';
import { StaticImageData } from 'next/image';

type ProjectKey =
  | 'redacted'
  | 'bookNook'
  | 'bubblesGenerator'
  | 'studentNameGenerator';
// | 'vetClinic';

interface IProjects {
  key: ProjectKey;
  title: string;
  description: string;
  tech: string[];
  github: string;
  live: string;
  image: StaticImageData;
}
const projects: Array<IProjects> = [
  {
    key: 'redacted',
    title: 'redacted.title',
    description: '< REDACTED />',
    tech: ['redacted.description'],
    github: 'https://github.com/',
    live: 'https://mrbubbles-src.dev',
    image: Redacted,
  },
  {
    key: 'bubblesGenerator',
    title: 'bubblesGenerator.title',
    description: 'bubblesGenerator.description',
    tech: [
      'TypeScript',
      'JavaScript',
      'Express.js',
      'Node.js',
      'MongoDB',
      'postgreSQL',
      'Mongoose',
      'Drizzle',
    ],
    github: 'https://github.com/mrbubbles-src/bubbles-express-generator',
    live: 'https://www.npmjs.com/package/bubbles-express-generator',
    image: BubblesGenerator,
  },
  {
    key: 'bookNook',
    title: 'bookNook.title',
    description: 'bookNook.description',
    tech: ['MongoDB', 'Express.js', 'React', 'Node.js', 'SASS'],
    github:
      'https://github.com/mrbubbles-src/dci-final-project-roomtwenty-booknook',
    live: 'https://roomtwenty-booknook.vercel.app/',
    image: BookNook,
  },
  {
    key: 'studentNameGenerator',
    title: 'studentNameGenerator.title',
    description: 'studentNameGenerator.description',
    tech: ['JavaScript', 'React', 'SASS'],
    github: 'https://github.com/mrbubbles-src/teacherbuddy',
    live: 'https://random-student-name-generator.vercel.app/',
    image: StudentNameGenerator,
  },
];

export { projects };
