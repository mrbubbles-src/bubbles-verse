interface IStack {
  Frontend: string[];
  Backend: string[];
  'Tooling & Design': string[];
}
const stack: IStack = {
  Frontend: [
    'HTML5',
    'CSS3',
    'SASS',
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'TailwindCSS',
    'Bootstrap',
    'Vite',
  ],
  Backend: [
    'Node.js',
    'Express.js',
    'MongoDB',
    'PostgreSQL',
    'MySQL',
    'Prisma',
  ],
  'Tooling & Design': ['Git', 'Figma', 'Adobe Suite', 'Affinity Suite'],
};
export { stack };
