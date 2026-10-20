// All portfolio content lives here. The 3D world, the battles and the classic page all render from
// this file, so editing text, links, media slots, enemies or moves never requires touching scene code.
// The places, fights and bosses follow the "Expedition24 - Journey Timeline" doc.

export type MediaSlot = {
  kind: 'image' | 'audio' | 'video'
  label: string
  src?: string // path under public/, e.g. 'media/song.mp3'; leave undefined for a "coming soon" frame
}

export type Link = { label: string; href: string }

export type Section = { title: string; bullets: string[]; links?: Link[]; media?: MediaSlot[] }

export type LandmarkKind =
  | 'camp'
  | 'proving'
  | 'millet'
  | 'archive'
  | 'lattice'
  | 'caverns'
  | 'watchtower'
  | 'peaks'
  | 'wellspring'
  | 'mirror'

// ---- battle data -------------------------------------------------------------------------------

export type Move = {
  id: string
  name: string
  cost: number // AP
  power: number
  text: string // what the move is, in terms of the real work
}

export type EnemyAttack = {
  name: string
  damage: number // per hit
  hits: number // one parry prompt per hit
  speed?: number // ms for the parry ring to close (default 1100)
  jitter?: boolean // randomise the timing: an unpredictable attack
}

export type Enemy = {
  name: string
  glyph: string
  color: string
  hp: number
  weakTo: string // Move id that deals double damage
  lore: string // the real problem this enemy stands for
  attacks: EnemyAttack[]
  hiddenUntil?: string // takes a quarter damage until this move has been used once
  enrage?: boolean // attacks speed up below half HP
}

export type Battle = {
  tutorial?: boolean
  moves: Move[]
  fights: Enemy[]
  boss: Enemy
  why: string // why the place, fights and boss fit the real work
}

// ---- regions -----------------------------------------------------------------------------------

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
  sections?: Section[]
  skills: string[] // "Pictos", earned by clearing the place (or visiting the Camp)
  links?: Link[]
  minigame?: 'bb84'
  battle?: Battle
  palette: { ground: string; sky: string; fog: string; accent: string }
}

export type Act = { number: number; title: string; subtitle: string }

export const profile = {
  name: 'Saroj Pedada',
  title: 'Software Developer · AI · Post-Quantum · Quantum Communication',
  location: 'Hyderabad, India',
  summary:
    'Software Developer at Quantum AI Global with a B.Tech in Computer Science and Artificial Intelligence from NSUT, Delhi. I work across AI/ML, Generative AI, full-stack and desktop apps, post-quantum cryptography and quantum communication, and I paint and play guitar when I am not shipping.',
  links: [
    { label: 'Email', href: 'mailto:sarojpedada@gmail.com' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sarojpedada/' },
    { label: 'GitHub', href: 'https://github.com/Saroj-Pedada' },
    { label: 'Instagram (art)', href: 'https://www.instagram.com/yosj.art/' },
  ] as Link[],
  resume: `${import.meta.env.BASE_URL}SarojPedada_Resume.pdf`,
}

export const player = { name: 'Saroj', hp: 120, startAp: 2, maxAp: 6 }

// Available in every battle.
export const baseMoves: Move[] = [
  { id: 'strike', name: 'Strike', cost: 0, power: 10, text: 'A plain hit. Builds 1 AP.' },
  { id: 'focus', name: 'Focus', cost: 2, power: 25, text: 'Take a breath and recover HP.' },
]

export const acts: Act[] = [
  { number: 0, title: 'Prologue', subtitle: 'The Camp' },
  { number: 1, title: 'Act I', subtitle: 'The Awakening' },
  { number: 2, title: 'Act II', subtitle: 'The Builder' },
  { number: 3, title: 'Act III', subtitle: 'The Quantum Frontier' },
]

const hit = (name: string, damage: number, hits = 1, extra: Partial<EnemyAttack> = {}): EnemyAttack => ({
  name,
  damage,
  hits,
  ...extra,
})

export const regions: Region[] = [
  {
    id: 'camp',
    act: 0,
    name: 'The Camp',
    landmark: 'camp',
    tagline: 'Somewhere to come back to. No fights here.',
    bullets: [
      'Rest here between battles. Every place you clear stays open, and the camp is always one click away.',
      'Ride forward with W / ↑ / scroll, or use the arrows below. The road opens one victory at a time.',
    ],
    sections: [
      {
        title: 'The Memory Wall',
        bullets: [
          'Age 16 (2018): Class X, CBSE, Dr. K.K.R. Gowtham High School, 89.8%.',
          'Age 18 (2020): Intermediate (PCM), Sri Venkateswara College, 9.63 CGPA.',
        ],
      },
      {
        title: 'The Easel',
        bullets: [
          'I draw and paint. The full gallery lives on Instagram and Playbook for now.',
          'ArtFlow: a web app to upload, arrange and manage images on a virtual canvas, with drag-and-drop and saved layouts.',
        ],
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
      },
      {
        title: 'The Fireside Guitar',
        bullets: ['Guitar is how I unwind. Recordings are coming soon.'],
        media: [
          { kind: 'audio', label: 'Recording' },
          { kind: 'video', label: 'Performance' },
        ],
      },
      {
        title: 'Side quests',
        bullets: [
          'Zombie Hunter: a 3D FPS built in Unity with custom C# controls and Blender-modelled environments, released for Windows on itch.io.',
          'AudioSpace: a real-time audio conversation platform inspired by Clubhouse, built with WebRTC, Node.js, React and PHP.',
        ],
        links: [
          { label: 'Zombie Hunter on itch.io', href: 'https://saroj-pedada.itch.io/zombie-hunter' },
          { label: 'AudioSpace on GitHub', href: 'https://github.com/Saroj-Pedada/PROJECT---AudioSpace' },
        ],
      },
    ],
    skills: ['Art', 'Guitar', 'Unity', 'C#', 'Blender', 'WebRTC', 'PHP'],
    palette: { ground: '#8a6a3f', sky: '#f2b56b', fog: '#e9a965', accent: '#ffcf7a' },
  },
  {
    id: 'proving',
    act: 0,
    name: 'The Proving Grounds',
    role: 'B.Tech, Computer Science & Artificial Intelligence',
    org: 'Netaji Subhas University of Technology, Delhi',
    dates: 'Ages 18–22 · 2020–2024',
    landmark: 'proving',
    tagline: 'Where I learned to fight.',
    bullets: ['B.Tech in Computer Science and Artificial Intelligence, NSUT Delhi, 7.75 CGPA.'],
    skills: ['C', 'C++', 'Python', 'Linux'],
    battle: {
      tutorial: true,
      why: 'The degree is where the moves were learned, so it is the tutorial: attack, use a skill, parry. Low stakes before the first real battle.',
      moves: [
        { id: 'debug', name: 'Debug', cost: 2, power: 18, text: 'Find the bug, squash the bug.' },
        { id: 'dsa', name: 'Data Structures', cost: 3, power: 24, text: 'The right structure turns a hard problem easy.' },
      ],
      fights: [
        {
          name: 'Syntax Slime',
          glyph: ';',
          color: '#8fd06a',
          hp: 30,
          weakTo: 'debug',
          lore: 'The first error every programmer meets.',
          attacks: [hit('Missing Semicolon', 8)],
        },
        {
          name: 'Off-by-One Imp',
          glyph: '±1',
          color: '#e0b04a',
          hp: 34,
          weakTo: 'debug',
          lore: 'Loops that run once too often, or once too few.',
          attacks: [hit('Index Out of Range', 10)],
        },
      ],
      boss: {
        name: 'The Final Exam',
        glyph: '✎',
        color: '#c9a046',
        hp: 70,
        weakTo: 'dsa',
        lore: 'Four years of coursework, one sitting.',
        attacks: [hit('Surprise Question', 12), hit("Time's Up", 8, 2)],
      },
    },
    palette: { ground: '#7d7a3e', sky: '#f0c27a', fog: '#e8bb7c', accent: '#ffe08a' },
  },
  {
    id: 'millet',
    act: 1,
    name: 'The Millet Fields',
    role: 'ML/AI Intern',
    org: 'Quantum AI Global · Remote',
    dates: 'Age 21 · May–Jul 2023',
    landmark: 'millet',
    tagline: 'First expedition beyond the camp.',
    bullets: [
      'Built an LMS.',
      'Millet info gathering for an AgriTech project, with a web UI and a chatbot.',
      'AI RAG project, which went on to an audit and report.',
      'Ran learning sessions for AI trainees, mentoring 25+ students on practical ML workflows.',
    ],
    skills: ['RAG', 'Chatbots', 'Scikit-Learn', 'Mentoring'],
    battle: {
      why: 'Fields for the farming data. The boss is an AI that answers confidently but wrongly, which the audit and report exposed.',
      moves: [
        { id: 'lms', name: 'Ship the LMS', cost: 2, power: 22, text: 'A working learning platform, delivered.' },
        { id: 'harvest', name: 'Harvest the Data', cost: 2, power: 22, text: 'Gather scattered millet data into one place.' },
        { id: 'audit', name: 'Audit Report', cost: 4, power: 34, text: 'Test every answer and write down where it fails.' },
      ],
      fights: [
        {
          name: 'LMS Golem',
          glyph: '▦',
          color: '#b0905a',
          hp: 45,
          weakTo: 'lms',
          lore: 'A learning platform that has to exist before anyone can learn on it.',
          attacks: [hit('Feature Creep', 12)],
        },
        {
          name: 'Millet Swarm',
          glyph: '⁂',
          color: '#d8c060',
          hp: 40,
          weakTo: 'harvest',
          lore: 'Farm data scattered across sources and formats.',
          attacks: [hit('Scatter', 6, 2)],
        },
      ],
      boss: {
        name: 'The Hollow Oracle',
        glyph: '◉',
        color: '#e8d8a0',
        hp: 110,
        weakTo: 'audit',
        lore: 'An AI that answers with total confidence, right or wrong.',
        attacks: [hit('Confident Hallucination', 16), hit('Citation Needed', 10, 2)],
      },
    },
    palette: { ground: '#7f7a3a', sky: '#f0d08a', fog: '#e6c680', accent: '#ffe08a' },
  },
  {
    id: 'archive',
    act: 1,
    name: 'The Archive of Echoes',
    role: 'ML/AI Intern',
    org: 'Quantum AI Global · Hyderabad',
    dates: 'Age 22 · Feb–May 2024',
    landmark: 'archive',
    tagline: 'Every answer is somewhere on these shelves.',
    bullets: [
      'Centred on one AI RAG project.',
      'Built features across front-end, back-end and ML pipelines to integrate and deploy Generative AI services.',
      'Used AI infrastructure platforms such as Fireworks AI and Groq Cloud for scalable performance.',
    ],
    skills: ['Generative AI', 'ML Pipelines', 'LangChain', 'Pinecone', 'Fireworks AI', 'Groq Cloud'],
    battle: {
      why: 'RAG lives or dies on pulling the right passages from an archive. The boss is a model that loses context.',
      moves: [
        { id: 'chunk', name: 'Chunking', cost: 2, power: 22, text: 'Split documents into pieces the model can use.' },
        { id: 'rerank', name: 'Re-rank', cost: 3, power: 26, text: 'Put the most relevant passages first.' },
        { id: 'ground', name: 'Ground the Answer', cost: 4, power: 36, text: 'Every claim tied back to a retrieved source.' },
      ],
      fights: [
        {
          name: 'Stray Chunk',
          glyph: '❒',
          color: '#b49ad8',
          hp: 48,
          weakTo: 'chunk',
          lore: 'A passage cut in the wrong place, meaningless on its own.',
          attacks: [hit('Half a Sentence', 13)],
        },
        {
          name: 'Embedding Wraith',
          glyph: '⌬',
          color: '#9a7ad0',
          hp: 52,
          weakTo: 'rerank',
          lore: 'Retrieval that returns things that look similar but are not relevant.',
          attacks: [hit('Near Miss', 8, 2)],
        },
      ],
      boss: {
        name: 'The Librarian Who Forgets',
        glyph: '❦',
        color: '#d9b8ff',
        hp: 130,
        weakTo: 'ground',
        lore: 'A model that loses the context it was just given.',
        attacks: [hit('Lost in the Middle', 17), hit('Context Overflow', 11, 2)],
      },
    },
    palette: { ground: '#4b3f6b', sky: '#b49ad8', fog: '#a891cf', accent: '#d9b8ff' },
  },
  {
    id: 'lattice',
    act: 2,
    name: 'The Lattice Pass',
    role: 'Software Developer · PQC VPN',
    org: 'Quantum AI Global',
    dates: 'Age 22–23 · 2024–2025',
    landmark: 'lattice',
    tagline: 'Tunnels sealed against quantum adversaries.',
    bullets: [
      'PQC VPN development: a VPN built on Post-Quantum Cryptography.',
      'Electron desktop client with multi-OS platform support, deployed to the cloud.',
    ],
    skills: ['Post-Quantum Cryptography', 'VPN / Networking', 'Electron.js', 'Multi-OS', 'Cloud'],
    battle: {
      why: 'Attackers can record traffic now and decrypt it later with a quantum computer ("harvest now, decrypt later"). Lattice-based crypto is the armour.',
      moves: [
        { id: 'kem', name: 'ML-KEM Handshake', cost: 3, power: 28, text: 'A key exchange a quantum computer cannot break.' },
        { id: 'multios', name: 'Cross-Platform Build', cost: 2, power: 24, text: 'One client, every operating system.' },
        { id: 'tunnel', name: 'Post-Quantum Tunnel', cost: 4, power: 40, text: 'Traffic sealed today stays sealed tomorrow.' },
      ],
      fights: [
        {
          name: 'Handshake Sentry',
          glyph: '⚿',
          color: '#5fb8b0',
          hp: 55,
          weakTo: 'kem',
          lore: 'A classical key exchange guarding the gate.',
          attacks: [hit('Downgrade Attempt', 14)],
        },
        {
          name: 'The Platform Hydra',
          glyph: '⋔',
          color: '#4a9a90',
          hp: 60,
          weakTo: 'multios',
          lore: 'One head per operating system, each with its own quirks.',
          attacks: [hit('Windows, macOS, Linux', 6, 3)],
        },
      ],
      boss: {
        name: 'The Harvest Reaper',
        glyph: '☾',
        color: '#9ffff0',
        hp: 150,
        weakTo: 'tunnel',
        lore: 'Records your traffic today, waits for a quantum computer tomorrow.',
        attacks: [hit('Harvest Now', 18), hit('Decrypt Later', 12, 2)],
      },
    },
    palette: { ground: '#2f6a6e', sky: '#8fd0cf', fog: '#86c4c4', accent: '#9ffff0' },
  },
  {
    id: 'caverns',
    act: 2,
    name: 'The Memory Caverns',
    role: 'Software Developer · Quantum Hardware',
    org: 'Quantum AI Global',
    dates: 'Age 22–23 · 2024–2025',
    landmark: 'caverns',
    tagline: 'Where light is held still.',
    bullets: [
      'QMem GUI interfacing with hardware, FPGAs and more.',
      "The control software for India's first quantum memory demonstration box for academia.",
    ],
    skills: ['PyQt', 'Hardware Interfacing', 'FPGA'],
    battle: {
      why: 'A quantum memory holds light still. The GUI has to drive real hardware in real time, so the hardware itself is the boss.',
      moves: [
        { id: 'fpga', name: 'FPGA Timing Sync', cost: 2, power: 26, text: 'Get the software and the FPGA ticking together.' },
        { id: 'signal', name: 'Clean Signal Path', cost: 3, power: 28, text: 'Filter the noise between device and screen.' },
        { id: 'panel', name: 'Live Control Panel', cost: 4, power: 42, text: 'One window that drives the whole experiment.' },
      ],
      fights: [
        {
          name: 'FPGA Imp',
          glyph: '⌗',
          color: '#5fd0e8',
          hp: 58,
          weakTo: 'fpga',
          lore: 'Timing that drifts between the board and the software.',
          attacks: [hit('Clock Skew', 14, 1, { speed: 950 })],
        },
        {
          name: 'Signal Gremlin',
          glyph: '∿',
          color: '#3ab0d0',
          hp: 58,
          weakTo: 'signal',
          lore: 'Noise on the line between the device and the screen.',
          attacks: [hit('Static', 8, 2)],
        },
      ],
      boss: {
        name: 'The Keeper of Stilled Light',
        glyph: '✧',
        color: '#7ff3ff',
        hp: 160,
        weakTo: 'panel',
        lore: 'The quantum memory itself: light stopped and stored, unforgiving of a wrong command.',
        attacks: [hit('Photon Lockup', 18), hit('Readout Storm', 8, 3)],
      },
    },
    palette: { ground: '#1f3550', sky: '#3e5f8a', fog: '#36557e', accent: '#7ff3ff' },
  },
  {
    id: 'watchtower',
    act: 2,
    name: 'The Watchtower',
    role: 'Software Developer · Vulnerability Assessment',
    org: 'Quantum AI Global',
    dates: 'Age 22–23 · 2024–2025',
    landmark: 'watchtower',
    tagline: 'Scanning the horizon for what a quantum computer would break.',
    bullets: [
      'Vulnerability assessment tool for websites, networks and code, from a post-quantum security point of view.',
      'Electron desktop app; worked on both the UI and the backend.',
    ],
    skills: ['Security Scanning', 'React.js', 'Node.js', 'Express.js'],
    battle: {
      why: 'One enemy type per thing the tool scans. The boss is the RSA and ECC crypto a quantum computer running Shor’s algorithm would break, which the tool finds.',
      moves: [
        { id: 'site', name: 'Site Scan', cost: 2, power: 24, text: 'Check a website’s TLS and certificates.' },
        { id: 'net', name: 'Network Sweep', cost: 2, power: 24, text: 'Map what is exposed on the network.' },
        { id: 'code', name: 'Code Audit', cost: 3, power: 28, text: 'Find weak crypto calls in source code.' },
        { id: 'inventory', name: 'Quantum-Safe Report', cost: 4, power: 44, text: 'Every vulnerable cipher listed, with its fix.' },
      ],
      fights: [
        {
          name: 'Website Phantom',
          glyph: '◌',
          color: '#c8a070',
          hp: 50,
          weakTo: 'site',
          lore: 'A site still served over quantum-breakable TLS.',
          attacks: [hit('Expired Certificate', 13)],
        },
        {
          name: 'Network Wraith',
          glyph: '⧖',
          color: '#a88060',
          hp: 54,
          weakTo: 'net',
          lore: 'An open port nobody remembers opening.',
          attacks: [hit('Open Port', 8, 2)],
        },
        {
          name: 'Code Mimic',
          glyph: '{}',
          color: '#d0b080',
          hp: 54,
          weakTo: 'code',
          lore: 'Code that looks safe but calls RSA underneath.',
          attacks: [hit('Hardcoded Key', 15)],
        },
      ],
      boss: {
        name: "Shor's Shadow",
        glyph: '⧉',
        color: '#ffcf7a',
        hp: 170,
        weakTo: 'inventory',
        lore: 'What a large quantum computer running Shor’s algorithm would do to RSA and ECC.',
        attacks: [hit('Factor the Key', 20), hit('Period Finding', 13, 2)],
      },
    },
    palette: { ground: '#6b4a32', sky: '#e0a070', fog: '#d49466', accent: '#ffcf7a' },
  },
  {
    id: 'peaks',
    act: 3,
    name: 'The Entangled Peaks',
    role: 'Software Developer · QKD',
    org: 'Quantum AI Global',
    dates: 'Age 23–24 · 2025–2026',
    landmark: 'peaks',
    tagline: 'Two summits, one state.',
    bullets: [
      'QKD EPS: software for an Entangled Photon Source used in Quantum Key Distribution.',
      'GUI applications for the QKD system.',
      'Try the BB84 key exchange below. Switch the eavesdropper on and watch the error rate jump.',
    ],
    skills: ['QKD', 'Entangled Photon Source', 'QKD Protocols'],
    minigame: 'bb84',
    battle: {
      why: 'The point of QKD is catching an eavesdropper. Eve can only be beaten after you spot her in the error rate, the same idea as the BB84 mini-game.',
      moves: [
        { id: 'align', name: 'Align the Source', cost: 2, power: 26, text: 'Point every entangled pair where it needs to go.' },
        { id: 'basis', name: 'Basis Reconciliation', cost: 3, power: 28, text: 'Keep only the bits where both sides agree.' },
        { id: 'qber', name: 'Measure the Error Rate', cost: 3, power: 30, text: 'An eavesdropper always leaves errors behind.' },
      ],
      fights: [
        {
          name: 'Lost Photon',
          glyph: '·',
          color: '#e8a0f0',
          hp: 60,
          weakTo: 'align',
          lore: 'Photons that never arrive at the detector.',
          attacks: [hit('Fade Out', 15)],
        },
        {
          name: 'Basis Sprite',
          glyph: '⊕',
          color: '#c78bd6',
          hp: 62,
          weakTo: 'basis',
          lore: 'Measurements in the wrong basis: half the bits, scrambled.',
          attacks: [hit('Wrong Basis', 8, 2)],
        },
      ],
      boss: {
        name: 'Eve, the Listener',
        glyph: '◐',
        color: '#ff9cf0',
        hp: 180,
        weakTo: 'qber',
        hiddenUntil: 'qber',
        lore: 'The eavesdropper. Invisible until the error rate gives her away.',
        attacks: [hit('Intercept', 20), hit('Resend', 12, 2)],
      },
    },
    palette: { ground: '#4a2a5e', sky: '#c78bd6', fog: '#b77fc9', accent: '#ff9cf0' },
  },
  {
    id: 'wellspring',
    act: 3,
    name: 'The Wellspring of Chance',
    role: 'Software Developer · QuRNG',
    org: 'Quantum AI Global',
    dates: 'Age 23–24 · 2025–2026',
    landmark: 'wellspring',
    tagline: 'Randomness straight from quantum physics.',
    bullets: [
      'QuRNG design and development: everything except the circuit.',
      'A software-based Quantum Random Number Generator API around the quantum circuit that produces the randomness.',
    ],
    skills: ['QRNG', 'API Design', 'REST APIs'],
    battle: {
      why: 'Random numbers are only useful if nobody can guess them. The boss tries to predict the next number, and its attacks come at unpredictable times.',
      moves: [
        { id: 'debias', name: 'Debias', cost: 2, power: 28, text: 'Strip the bias out of raw quantum bits.' },
        { id: 'entropy', name: 'Entropy Pool', cost: 3, power: 28, text: 'Keep a healthy reserve of fresh randomness.' },
        { id: 'api', name: 'True Randomness API', cost: 4, power: 46, text: 'Quantum randomness, one request away.' },
      ],
      fights: [
        {
          name: 'Bias Sprite',
          glyph: '⚀',
          color: '#f3d98a',
          hp: 62,
          weakTo: 'debias',
          lore: 'Raw bits that lean towards 0 or 1.',
          attacks: [hit('Loaded Die', 15)],
        },
        {
          name: 'Entropy Leech',
          glyph: '≋',
          color: '#d8b860',
          hp: 66,
          weakTo: 'entropy',
          lore: 'Drains the randomness faster than it is produced.',
          attacks: [hit('Drain', 8, 2)],
        },
      ],
      boss: {
        name: 'The Predictor',
        glyph: '⚄',
        color: '#ffe9a0',
        hp: 190,
        weakTo: 'api',
        lore: 'Tries to guess the next number. Its attacks are timed to be unguessable too.',
        attacks: [hit('I Saw That Coming', 20, 1, { jitter: true }), hit('Next Number', 9, 3, { jitter: true })],
      },
    },
    palette: { ground: '#6b5a2a', sky: '#f3d98a', fog: '#e8cf80', accent: '#ffe9a0' },
  },
  {
    id: 'mirror',
    act: 3,
    name: 'The Mirror Sea',
    role: 'Software Developer · QNTSim',
    org: 'Quantum AI Global',
    dates: 'Age 23–24 · 2025–2026 · now',
    landmark: 'mirror',
    tagline: 'A whole quantum network, reflected in simulation.',
    bullets: [
      'QNTSim design and development: everything except the circuits.',
      'Quantum communication protocols and applications on QNTSim, a quantum network simulator.',
    ],
    skills: ['QNTSim', 'Quantum Networks', 'Simulation'],
    battle: {
      why: 'A network simulator has to model noise and loss across a whole quantum network. It is the latest and widest work, so it ends the journey.',
      moves: [
        { id: 'loss', name: 'Model Channel Loss', cost: 2, power: 30, text: 'Account for every photon a fibre swallows.' },
        { id: 'purify', name: 'Purify Entanglement', cost: 3, power: 30, text: 'Turn many noisy pairs into fewer, cleaner ones.' },
        { id: 'simulate', name: 'Simulate the Network', cost: 4, power: 50, text: 'Every node, link and protocol, run end to end.' },
      ],
      fights: [
        {
          name: 'Lost Qubit',
          glyph: '○',
          color: '#9ad0f0',
          hp: 66,
          weakTo: 'loss',
          lore: 'A qubit that left one node and never reached the next.',
          attacks: [hit('Vanish', 16)],
        },
        {
          name: 'Decoherence Wisp',
          glyph: '≈',
          color: '#7ab0e0',
          hp: 70,
          weakTo: 'purify',
          lore: 'Noise that slowly erases a quantum state.',
          attacks: [hit('Fade', 9, 2)],
        },
      ],
      boss: {
        name: 'The Noise Leviathan',
        glyph: '❂',
        color: '#bfe8ff',
        hp: 230,
        weakTo: 'simulate',
        enrage: true,
        lore: 'All the noise of a real quantum network at once. Gets faster when wounded.',
        attacks: [hit('Tidal Noise', 22), hit('Decoherence Wave', 10, 3)],
      },
    },
    palette: { ground: '#2a4a6a', sky: '#a0c8e8', fog: '#94bcdc', accent: '#bfe8ff' },
  },
]

export const allSkills = Array.from(new Set(regions.flatMap((r) => r.skills)))
export const battleIndices = regions.flatMap((r, i) => (r.battle ? [i] : []))
