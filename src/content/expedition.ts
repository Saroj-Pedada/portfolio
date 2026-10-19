// All portfolio content lives here. The 3D world and the classic page both render from this file,
// so editing text, links or media slots never requires touching scene code.

export type MediaSlot = {
  kind: 'image' | 'audio' | 'video'
  label: string
  src?: string // leave undefined to show an empty "coming soon" frame
}

export type Link = { label: string; href: string }

export type LandmarkKind =
  | 'camp'
  | 'outpost'
  | 'grove'
  | 'spire'
  | 'foundry'
  | 'archipelago'
  | 'harbor'
  | 'caverns'
  | 'peaks'
  | 'wellspring'
  | 'atelier'
  | 'amphitheater'
  | 'arcade'
  | 'monolith'

export type Region = {
  id: string
  act: number
  name: string
  role?: string
  org?: string
  dates?: string
  landmark: LandmarkKind
  tagline: string
  bullets: string[]
  skills: string[] // collected as "Pictos" when the expedition passes this flag
  links?: Link[]
  media?: MediaSlot[]
  minigame?: 'bb84'
  palette: { ground: string; sky: string; fog: string; accent: string }
}

export type Act = { number: number; title: string; subtitle: string }

export const profile = {
  name: 'Saroj Pedada',
  title: 'Software Developer · AI · Post-Quantum · Quantum Communication',
  location: 'Hyderabad, India',
  summary:
    'Software Developer at Quantum AI Global with a B.Tech in Computer Science and Artificial Intelligence from NSUT, Delhi. I work across AI/ML, Generative AI, full-stack and desktop apps, cloud, post-quantum cryptography and quantum communication, and I paint and play guitar when I am not shipping.',
  links: [
    { label: 'Email', href: 'mailto:sarojpedada@gmail.com' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sarojpedada/' },
    { label: 'GitHub', href: 'https://github.com/Saroj-Pedada' },
    { label: 'Instagram (art)', href: 'https://www.instagram.com/yosj.art/' },
  ] as Link[],
  resume: '/SarojPedada_Resume.pdf',
}

export const acts: Act[] = [
  { number: 0, title: 'Prologue', subtitle: 'The Camp' },
  { number: 1, title: 'Act I', subtitle: 'The Awakening' },
  { number: 2, title: 'Act II', subtitle: 'The Builder' },
  { number: 3, title: 'Act III', subtitle: 'The Quantum Frontier' },
  { number: 4, title: 'Act IV', subtitle: 'The Atelier' },
  { number: 5, title: 'Epilogue', subtitle: 'The Monolith' },
]

export const regions: Region[] = [
  {
    id: 'camp',
    act: 0,
    name: 'The Camp',
    role: 'B.Tech, Computer Science & Artificial Intelligence',
    org: 'Netaji Subhas University of Technology, Delhi',
    dates: '2020 – 2024',
    landmark: 'camp',
    tagline: 'Where the expedition sets out.',
    bullets: [
      'B.Tech in Computer Science and Artificial Intelligence, NSUT Delhi (CGPA 7.75).',
      'Intermediate (PCM), Sri Venkateswara College, 9.63 CGPA · CBSE Class X, Dr. K.K.R. Gowtham High School, 89.8%.',
      'Ride forward with W / ↑ / scroll, or pick a stop on the timeline below.',
    ],
    skills: ['C', 'C++', 'Python', 'Linux'],
    palette: { ground: '#8a6a3f', sky: '#f2b56b', fog: '#e9a965', accent: '#ffcf7a' },
  },
  {
    id: 'outpost',
    act: 0,
    name: 'The Outpost',
    role: 'ML/AI Intern',
    org: 'Quantum AI Global · Remote',
    dates: 'May 2023 – Jul 2023',
    landmark: 'outpost',
    tagline: 'First expedition beyond the camp.',
    bullets: [
      'Developed AI-driven tools for an AgriTech project, including the web UI and a chatbot.',
      'Researched how Gen AI pipelines work and deploy, for an AI assessment tool.',
      'Ran learning sessions for AI trainees, mentoring 25+ students on practical ML workflows.',
    ],
    skills: ['Chatbots', 'Scikit-Learn', 'Mentoring'],
    palette: { ground: '#7d7a3e', sky: '#f0c27a', fog: '#e8bb7c', accent: '#ffe08a' },
  },
  {
    id: 'grove',
    act: 1,
    name: 'Spark Grove',
    role: 'ML/AI Intern',
    org: 'Quantum AI Global · Hyderabad',
    dates: 'Feb 2024 – May 2024',
    landmark: 'grove',
    tagline: 'Generative AI, end to end.',
    bullets: [
      'Contributed to Generative AI full-stack products.',
      'Built key features across front-end, back-end and ML pipelines to integrate and deploy Gen AI services.',
      'Used AI infrastructure platforms such as Fireworks AI and Groq Cloud for scalable performance.',
    ],
    skills: ['Generative AI', 'ML Pipelines', 'Fireworks AI', 'Groq Cloud', 'React.js', 'Node.js'],
    palette: { ground: '#5f7f3a', sky: '#cfe0a0', fog: '#c6d898', accent: '#f6ff9a' },
  },
  {
    id: 'spire',
    act: 1,
    name: 'The Spire',
    role: 'AI/ML Engineer',
    org: 'Quantum AI Global · Hyderabad',
    dates: 'Jun 2024 – Aug 2024',
    landmark: 'spire',
    tagline: 'Climbing the tower of models.',
    // TODO(saroj): replace with real highlights from this phase.
    bullets: [
      'Add 2–3 highlights from your AI/ML Engineer phase here.',
    ],
    skills: ['LangChain', 'OpenAI', 'Pinecone', 'TensorFlow'],
    palette: { ground: '#4b3f6b', sky: '#b49ad8', fog: '#a891cf', accent: '#d9b8ff' },
  },
  {
    id: 'foundry',
    act: 2,
    name: 'The Foundry',
    role: 'Software Developer',
    org: 'Quantum AI Global · Hyderabad',
    dates: '2024 – 2025',
    landmark: 'foundry',
    tagline: 'Forging desktop apps for a post-quantum world.',
    bullets: [
      'Built Electron desktop applications for the PQC VPN client and the post-quantum vulnerability analysis tool.',
      'The vulnerability analysis tool scans code, networks and websites from a post-quantum security point of view. Worked on both the UI and the backend.',
    ],
    skills: ['Electron.js', 'React.js', 'Node.js', 'Express.js'],
    palette: { ground: '#7a4a2e', sky: '#e09a6a', fog: '#d48c5e', accent: '#ff9a4a' },
  },
  {
    id: 'archipelago',
    act: 2,
    name: 'Lattice Archipelago',
    role: 'Software Developer · PQC VPN',
    org: 'Quantum AI Global',
    dates: '2025',
    landmark: 'archipelago',
    tagline: 'Tunnels sealed against quantum adversaries.',
    bullets: [
      'Contributed to a VPN solution built on Post-Quantum Cryptography.',
      'Multi-OS platform support across the client applications.',
    ],
    skills: ['Post-Quantum Cryptography', 'VPN / Networking', 'Multi-OS'],
    palette: { ground: '#2f6a6e', sky: '#8fd0cf', fog: '#86c4c4', accent: '#9ffff0' },
  },
  {
    id: 'harbor',
    act: 2,
    name: 'Sky Harbor',
    role: 'Software Developer · Cloud',
    org: 'Quantum AI Global',
    dates: '2025',
    landmark: 'harbor',
    tagline: 'Shipping it to the clouds.',
    // TODO(saroj): add specifics (services, scale, CI/CD) for the cloud deployment work.
    bullets: ['Deployed the products to the cloud.'],
    skills: ['AWS', 'Google Cloud Platform', 'PostgreSQL', 'REST APIs'],
    palette: { ground: '#6f86a6', sky: '#dfe9f5', fog: '#d4e1ef', accent: '#ffffff' },
  },
  {
    id: 'caverns',
    act: 3,
    name: 'Memory Caverns',
    role: 'Software Developer · Quantum Hardware',
    org: 'Quantum AI Global',
    dates: '2024 – 2025',
    landmark: 'caverns',
    tagline: 'Where light is held still.',
    bullets: [
      "Built the interfacing GUI for India's first quantum memory demonstration box for academia.",
      'Developed and delivered intuitive GUI applications for a QKD system.',
    ],
    skills: ['PyQt', 'Hardware Interfacing', 'QKD'],
    palette: { ground: '#1f3550', sky: '#3e5f8a', fog: '#36557e', accent: '#7ff3ff' },
  },
  {
    id: 'peaks',
    act: 3,
    name: 'Entangled Peaks',
    role: 'Software Developer · QNTSim',
    org: 'Quantum AI Global',
    dates: '2025 – 2026',
    landmark: 'peaks',
    tagline: 'Two summits, one state.',
    // TODO(saroj): add the protocols/applications you built and a QNTSim link.
    bullets: [
      'Quantum communication protocols and applications on QNTSim, a quantum network simulator.',
      'Try the BB84 key exchange below. Switch the eavesdropper on and watch the error rate jump.',
    ],
    skills: ['QNTSim', 'Quantum Networks', 'QKD Protocols'],
    minigame: 'bb84',
    palette: { ground: '#4a2a5e', sky: '#c78bd6', fog: '#b77fc9', accent: '#ff9cf0' },
  },
  {
    id: 'wellspring',
    act: 3,
    name: 'Wellspring of Chance',
    role: 'Software Developer · QRNG',
    org: 'Quantum AI Global',
    dates: '2026 – now',
    landmark: 'wellspring',
    tagline: 'The edge of the map. Where I am today.',
    bullets: [
      'Building a software-based Quantum Random Number Generator API: everything around the quantum circuit that produces the randomness.',
    ],
    skills: ['QRNG', 'API Design'],
    palette: { ground: '#6b5a2a', sky: '#f3d98a', fog: '#e8cf80', accent: '#ffe9a0' },
  },
  {
    id: 'atelier',
    act: 4,
    name: 'The Atelier',
    landmark: 'atelier',
    tagline: 'Paint, canvas, and the tools I build for both.',
    bullets: [
      'I draw and paint. The full gallery lives on Instagram and Playbook for now.',
      'ArtFlow: a web app to upload, arrange and manage images on a virtual canvas, with drag-and-drop and saved layouts.',
    ],
    skills: ['Art', 'Canvas APIs'],
    links: [
      { label: 'Instagram @yosj.art', href: 'https://www.instagram.com/yosj.art/' },
      { label: 'Playbook', href: 'https://www.playbook.com/yosana' },
      { label: 'Try ArtFlow', href: 'https://artflow-dev.vercel.app/' },
    ],
    media: [
      { kind: 'image', label: 'Artwork' },
      { kind: 'image', label: 'Artwork' },
      { kind: 'image', label: 'Artwork' },
    ],
    palette: { ground: '#8a5a52', sky: '#f2c0b0', fog: '#e8b4a4', accent: '#ffd0c0' },
  },
  {
    id: 'amphitheater',
    act: 4,
    name: 'The Amphitheater',
    landmark: 'amphitheater',
    tagline: 'Six strings under an open sky.',
    bullets: ['Guitar is how I unwind. Recordings are coming soon.'],
    skills: ['Guitar'],
    media: [
      { kind: 'audio', label: 'Recording' },
      { kind: 'video', label: 'Performance' },
    ],
    palette: { ground: '#6a2f2f', sky: '#d98a6a', fog: '#cc7e60', accent: '#ffb07a' },
  },
  {
    id: 'arcade',
    act: 4,
    name: 'The Arcade',
    landmark: 'arcade',
    tagline: 'Side quests.',
    bullets: [
      'Zombie Hunter: a 3D FPS built in Unity with custom C# controls and Blender-modelled environments, released for Windows on itch.io.',
      'AudioSpace: a real-time audio conversation platform inspired by Clubhouse, built with WebRTC, Node.js, React and PHP.',
    ],
    skills: ['Unity', 'C#', 'Blender', 'WebRTC', 'PHP'],
    links: [
      { label: 'Zombie Hunter on itch.io', href: 'https://saroj-pedada.itch.io/zombie-hunter' },
      { label: 'AudioSpace on GitHub', href: 'https://github.com/Saroj-Pedada/PROJECT---AudioSpace' },
    ],
    palette: { ground: '#352a5a', sky: '#7a5ac8', fog: '#6e52b8', accent: '#ff5ad8' },
  },
  {
    id: 'monolith',
    act: 5,
    name: 'The Monolith',
    landmark: 'monolith',
    tagline: 'End of this expedition. The next one could be with you.',
    bullets: ['Want to build something together? Reach out.'],
    skills: [],
    palette: { ground: '#2a2630', sky: '#4a3f52', fog: '#3e3546', accent: '#ffd27a' },
  },
]

export const allSkills = Array.from(new Set(regions.flatMap((r) => r.skills)))
