export function parseResumeText(text) {
  const result = {
    full_name: null,
    email: null,
    phone: null,
    institution: null,
    degree_type: null,
    field_of_study: null,
    year_of_graduation: null,
    github: null,
    linkedin: null,
    skills: [],
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) result.email = emailMatch[0]

  // Phone — Indian format (+91 prefix optional)
  const phoneMatch = text.match(/(?:\+91[-\s]?)?[6-9]\d{9}/)
  if (phoneMatch) result.phone = phoneMatch[0].replace(/\D/g, '').slice(-10)

  // GitHub — with or without https://
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/)
  if (githubMatch) result.github = 'https://github.com/' + githubMatch[1]

  // LinkedIn — with or without https://, handle hyphens in username
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/)
  if (linkedinMatch) result.linkedin = 'https://linkedin.com/in/' + linkedinMatch[1]

  // Graduation year — look for a 4-digit year in range 2020–2035
  // Also handle formats like "Aug 2025", "2021 – 2025", "Oct 2021 – Aug 2025"
  const yearMatches = [...text.matchAll(/\b(20(?:2[0-9]|3[0-5]))\b/g)].map(m => m[1])
  if (yearMatches.length > 0) {
    // Pick the latest year (graduation is usually the end date)
    result.year_of_graduation = yearMatches.sort().pop()
  }

  // Degree type — expanded patterns including spelled-out forms
  const degreePatterns = [
    { pattern: /\bB\.?Tech\b|\bBachelor of Technology\b/i, value: 'B.Tech' },
    { pattern: /\bB\.?E\.?\b|\bBachelor of Engineering\b/i, value: 'B.E.' },
    { pattern: /\bM\.?Tech\b|\bMaster of Technology\b/i, value: 'M.Tech' },
    { pattern: /\bMBA\b|\bMaster of Business\b/i, value: 'MBA' },
    { pattern: /\bBCA\b/i, value: 'BCA' },
    { pattern: /\bMCA\b/i, value: 'MCA' },
    { pattern: /\bB\.?Sc\b|\bBachelor of Science\b/i, value: 'B.Sc' },
    { pattern: /\bM\.?Sc\b|\bMaster of Science\b/i, value: 'M.Sc' },
    { pattern: /\bBBA\b/i, value: 'BBA' },
    { pattern: /\bB\.?Com\b/i, value: 'B.Com' },
    { pattern: /\bLLB\b/i, value: 'LLB' },
    { pattern: /\bPh\.?D\b/i, value: 'Ph.D' },
  ]
  for (const { pattern, value } of degreePatterns) {
    if (pattern.test(text)) { result.degree_type = value; break }
  }

  // Field of study — ordered by specificity
  const fieldPatterns = [
    { pattern: /artificial intelligence|AI\/ML|machine learning/i, value: 'AI & ML' },
    { pattern: /computer science/i, value: 'Computer Science' },
    { pattern: /information technology/i, value: 'Information Technology' },
    { pattern: /electronics.*communication|ECE/i, value: 'Electronics & Communication' },
    { pattern: /electrical/i, value: 'Electrical Engineering' },
    { pattern: /mechanical/i, value: 'Mechanical Engineering' },
    { pattern: /civil engineering/i, value: 'Civil Engineering' },
    { pattern: /data science/i, value: 'Data Science' },
    { pattern: /biotechnology/i, value: 'Biotechnology' },
    { pattern: /cybersecurity/i, value: 'Cybersecurity' },
  ]
  for (const { pattern, value } of fieldPatterns) {
    if (pattern.test(text)) { result.field_of_study = value; break }
  }

  // Skills — match against known tech skills list
  const knownSkills = [
    'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express.js',
    'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Python', 'JavaScript',
    'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift',
    'PHP', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'GraphQL',
    'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase', 'Supabase',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Git',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'Data Science', 'Pandas', 'NumPy', 'Figma', 'Flutter', 'React Native',
    'Blockchain', 'Solidity', 'Unity', 'Android', 'iOS',
  ]
  result.skills = knownSkills.filter(skill =>
    new RegExp(`\\b${skill.replace(/[.+]/g, c => `\\${c}`)}\\b`, 'i').test(text)
  ).slice(0, 10)

  // Institution — look for common university/college keywords
  // Also stop at comma or newline to avoid capturing too much
  const institutionMatch = text.match(
    /(?:University|Institute of Technology|Institute|College|IIT|NIT|BITS|VIT|SRM|IIIT|Amity|Manipal|LPU|Osmania)[^,\n]{0,60}/i
  )
  if (institutionMatch) result.institution = institutionMatch[0].trim()

  // Full name — first non-empty line that looks like a name (2-4 words, all letters + spaces)
  for (const line of lines.slice(0, 8)) {
    if (/^[A-Za-z]+(?: [A-Za-z]+){1,3}$/.test(line) && line.length > 4 && line.length < 60) {
      result.full_name = line
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
      break
    }
  }

  return result
}
