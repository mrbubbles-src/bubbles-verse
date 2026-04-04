import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckListIcon,
  Flag01Icon,
  FlashIcon,
  Folder01Icon,
  HugeiconsIcon,
  PlayCircle02Icon,
  ShuffleIcon,
  SparklesIcon,
  Target01Icon,
  UserGroupIcon,
} from '@bubbles/ui/lib/hugeicons';

import Logo from '@/public/images/teacherbuddy-logo.png';

type Phase = {
  id: string;
  label: string;
  subtitle: string;
  icon: typeof BookOpen01Icon;
  color: string;
  features: {
    title: string;
    description: string;
    href: string;
    icon: typeof UserGroupIcon;
    badge: string;
  }[];
};

const phases: Phase[] = [
  {
    id: 'prepare',
    label: 'Prepare',
    subtitle: 'Set up before class',
    icon: BookOpen01Icon,
    color: 'var(--chart-1)',
    features: [
      {
        title: 'Students',
        description: 'Add students, mark absences, and keep your roster tidy.',
        href: '/students',
        icon: UserGroupIcon,
        badge: 'Roster',
      },
      {
        title: 'Quiz Builder',
        description: 'Create quizzes with custom questions and answers.',
        href: '/quizzes',
        icon: CheckListIcon,
        badge: 'Create',
      },
    ],
  },
  {
    id: 'start',
    label: 'Start',
    subtitle: 'Kick off the lesson',
    icon: FlashIcon,
    color: 'var(--chart-2)',
    features: [
      {
        title: 'Generator',
        description: 'Randomly pick a student without repeats until reset.',
        href: '/generator',
        icon: ShuffleIcon,
        badge: 'Random',
      },
    ],
  },
  {
    id: 'engage',
    label: 'Engage',
    subtitle: 'Run classroom activities',
    icon: Target01Icon,
    color: 'var(--chart-4)',
    features: [
      {
        title: 'Breakout Rooms',
        description: 'Create randomized student groups for breakout sessions.',
        href: '/breakout-rooms',
        icon: UserGroupIcon,
        badge: 'Groups',
      },
      {
        title: 'Quiz Play',
        description: 'Draw a student + question, then reveal the answer.',
        href: '/play',
        icon: PlayCircle02Icon,
        badge: 'Live',
      },
    ],
  },
  {
    id: 'review',
    label: 'Review',
    subtitle: 'Organize and reflect',
    icon: Flag01Icon,
    color: 'var(--chart-5)',
    features: [
      {
        title: 'Projects',
        description: 'Build student lists and manage grouped project teams.',
        href: '/projects',
        icon: Folder01Icon,
        badge: 'Lists',
      },
    ],
  },
];

/**
 * Renders a combined dashboard with the command center hero from design-1
 * and the timeline phase flow from design-2.
 */
export default function DashboardCards() {
  return (
    <div className="flex flex-col gap-10">
      {/* Command Center Hero (from design-1) */}
      <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-lg md:p-8 lg:p-10">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, var(--primary) 1px, transparent 1px), radial-gradient(circle at 75% 75%, var(--primary) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative flex flex-col items-center gap-4 text-center md:flex-row md:text-left lg:gap-8">
          <div className="w-full max-w-[200px] shrink-0 md:max-w-[240px] lg:max-w-[280px]">
            <Image
              src={Logo}
              alt="TeacherBuddy — free classroom management tools for teachers"
              width={895}
              height={372}
              sizes="(max-width: 768px) 200px, (max-width: 1024px) 240px, 280px"
              priority
              placeholder="blur"
              blurDataURL={Logo.blurDataURL}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <HugeiconsIcon
                icon={SparklesIcon}
                strokeWidth={2}
                className="size-4 text-primary"
              />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Command Center
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-3xl">
              Everything you need,{' '}
              <span className="text-primary">one dashboard.</span>
            </h2>
            <p className="max-w-lg text-sm text-muted-foreground md:text-base/relaxed">
              Manage students, run quizzes, and organize class activities —
              choose a workflow below to get started.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Phase Flow (from design-2) */}
      <div className="relative flex flex-col gap-0">
        {phases.map((phase, phaseIndex) => {
          const isLast = phaseIndex === phases.length - 1;
          const nextPhaseColor = phases[phaseIndex + 1]?.color ?? phase.color;

          return (
            <div
              key={phase.id}
              className="relative flex gap-4 md:gap-6 lg:gap-8">
              {/* Timeline spine */}
              <div className="flex flex-col items-center">
                {/* Phase node */}
                <div
                  className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 shadow-md md:size-12"
                  style={{
                    borderColor: phase.color,
                    backgroundColor: `color-mix(in oklch, ${phase.color} 12%, var(--card))`,
                  }}>
                  <HugeiconsIcon
                    icon={phase.icon}
                    strokeWidth={2}
                    className="size-4 md:size-5"
                    style={{ color: phase.color }}
                  />
                </div>
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className="w-0.5 flex-1 min-h-4"
                    style={{
                      background: `linear-gradient(to bottom, ${phase.color}, ${nextPhaseColor})`,
                      opacity: 0.3,
                    }}
                  />
                )}
              </div>

              {/* Phase content */}
              <div className="flex-1 pb-8">
                {/* Phase label */}
                <div className="mb-3 flex items-baseline gap-3 pt-2">
                  <h2
                    className="text-lg font-bold tracking-tight md:text-xl"
                    style={{ color: phase.color }}>
                    {phase.label}
                  </h2>
                  <span className="text-xs text-muted-foreground md:text-sm">
                    {phase.subtitle}
                  </span>
                </div>

                {/* Feature cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {phase.features.map((feature) => {
                    return (
                      <Link
                        key={feature.title}
                        href={feature.href}
                        className="touch-hitbox group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border active:scale-[0.98]">
                        {/* Subtle left accent */}
                        <div
                          className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                          style={{
                            backgroundColor: phase.color,
                            opacity: 0.6,
                          }}
                        />

                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <HugeiconsIcon
                              icon={feature.icon}
                              strokeWidth={2}
                              className="size-4.5"
                              style={{ color: phase.color }}
                            />
                            <h3 className="font-semibold text-foreground">
                              {feature.title}
                            </h3>
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `color-mix(in oklch, ${phase.color} 10%, transparent)`,
                              color: phase.color,
                            }}>
                            {feature.badge}
                          </span>
                        </div>

                        <p className="text-sm/relaxed text-muted-foreground">
                          {feature.description}
                        </p>

                        <div
                          className="mt-auto flex items-center gap-1.5 text-sm font-medium transition-all duration-200 group-hover:translate-x-1"
                          style={{ color: phase.color }}>
                          Open {feature.title}
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            strokeWidth={2}
                            className="size-3.5"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
