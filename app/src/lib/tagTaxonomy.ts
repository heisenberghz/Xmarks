/**
 * Canonical 8-Category Taxonomy tuned specifically for the user's X bookmarks library.
 * Covers: #ai, #resources, #design, #dev, #tools, #watchlist, #startup, #health
 */

export interface TaxonomyCategory {
  tag: string;
  label: string;
  description: string;
  keywords: string[];
  domains?: string[];
  authorPatterns?: string[];
}

export const TAXONOMY_CATEGORIES: TaxonomyCategory[] = [
  {
    tag: 'ai',
    label: 'Artificial Intelligence',
    description: 'LLMs, AI agents, Claude, OpenAI, prompts, and machine learning models',
    keywords: [
      'ai', 'claude', 'anthropic', 'sonnet', 'opus', 'haiku',
      'gpt', 'gpt-4', 'gpt-5', 'gpt-6', 'openai', 'gemini', 'deepseek', 'mistral',
      'agent', 'agents', 'agentic', 'jev', 'prompt', 'prompts', 'prompting',
      'fine-tune', 'fine tune', 'lora', 'tokenizer', 'diffusion', 'midjourney',
      'world model', 'robotics', 'local model', 'ai images', 'ai video', 'generative',
      'llm', 'llms', 'slm', 'slms', 'rag', 'embeddings', 'crewai', 'langchain', 'autogen'
    ],
    domains: [
      'huggingface.co', 'chatgpt.com', 'anthropic.com', 'orcarouter.ai', 'deepseek.com', 'openai.com'
    ],
    authorPatterns: [
      'agent', 'ai', 'gpt', 'minimax'
    ]
  },
  {
    tag: 'resources',
    label: 'Free Resources & Learning',
    description: 'Free courses, books, roadmaps, cheat sheets, guides, and learning materials',
    keywords: [
      'free', 'course', 'courses', 'learn', 'learning', 'guide', 'roadmap',
      'tutorial', 'book', 'books', 'pdf', 'handbook', 'free resource', 'free course',
      'masterclass', 'curriculum', 'cheatsheet', 'cheat sheet', 'notes', 'resources',
      'freebies', 'freebie', 'github education', 'roadmap.sh'
    ],
    domains: [
      'goalkicker.com', 'skills.sh', 'claude-skills.free', 'exercism.org', 'roadmap.sh'
    ]
  },
  {
    tag: 'design',
    label: 'Design & UI/UX',
    description: 'UI/UX design, Figma, typography, fonts, landing pages, and components',
    keywords: [
      'design', 'ui', 'ux', 'figma', 'typography', 'typeface', 'typefaces',
      'font', 'fonts', 'landing page', 'animation', 'style', 'components',
      'shadcn', 'opensourceui', 'animos', 'inspora', 'palette', 'mockup',
      'portfolio', 'wireframe', 'css', 'design system', 'design tokens',
      'backgrounds.supply', 'assets'
    ],
    domains: [
      'figma.com', 'opensourceui.in', 'designmd.me', 'inspora.design',
      'animos.app', 'backgrounds.supply', 'dribbble.com', 'behance.net', 'refero.design'
    ],
    authorPatterns: [
      'design', 'ui', 'ux'
    ]
  },
  {
    tag: 'dev',
    label: 'Software Engineering & Dev',
    description: 'Coding, GitHub repositories, software architecture, backend, and web dev',
    keywords: [
      'code', 'coding', 'github', 'repo', 'git', 'terminal', 'developer',
      'software engineer', 'python', 'javascript', 'typescript', 'react',
      'nextjs', 'css', 'tailwind', 'api', 'backend', 'database', 'sql',
      'postgres', 'docker', 'system design', 'architecture', 'algorithm',
      'data structure', 'linux', 'bash', 'npm', 'pnpm', 'vite'
    ],
    domains: [
      'github.com', 'gitlab.com', 'exercism.org', 'npmjs.com', 'vercel.com', 'stackoverflow.com'
    ],
    authorPatterns: [
      'dev', 'engineer', 'systemdesign'
    ]
  },
  {
    tag: 'tools',
    label: 'Tools & Productivity',
    description: 'Coding agents (Cline, Cursor), extensions, workflows, and productivity software',
    keywords: [
      'tool', 'tools', 'extension', 'app', 'software', 'workflow', 'cline',
      'cursor', 'windsurf', 'automation', 'productivity', 'chrome extension',
      'utilities', 'plugin', 'vscode'
    ],
    domains: [
      'chromewebstore.google.com', 'cursor.com'
    ]
  },
  {
    tag: 'watchlist',
    label: 'Watchlist & Media',
    description: 'Curated movies, series, documentaries, and thriller recommendations',
    keywords: [
      'movie', 'movies', 'series', 'film', 'cinema', 'documentary', 'watch',
      'episode', 'thriller', 'recommendation', 'recommendations', 'cia'
    ]
  },
  {
    tag: 'startup',
    label: 'Startups & Business',
    description: 'Founders, SaaS, monetization, building in public, and marketing',
    keywords: [
      'startup', 'founder', 'founders', 'saas', 'monetization', 'mrr', 'arr',
      'pricing', 'business', 'money', 'revenue', 'launch', 'marketing',
      'copywriting', 'sales', 'buildinpublic', 'indie hacker', 'creator',
      'faceless channel'
    ],
    domains: [
      'producthunt.com'
    ]
  },
  {
    tag: 'health',
    label: 'Health & Habits',
    description: 'Workouts, posture, sleep, nutrition, exercises, and wellness habits',
    keywords: [
      'push ups', 'pushups', 'exercise', 'exercises', 'workout', 'gym', 'health',
      'posture', 'sleep', 'diet', 'eyes', 'habits', 'fitness', 'nutrition'
    ]
  }
];
