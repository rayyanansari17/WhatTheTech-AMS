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

  // Phone — Indian format
  const phoneMatch = text.match(/(?:\+91[-\s]?)?[6-9]\d{9}/)
  if (phoneMatch) result.phone = phoneMatch[0].replace(/\D/g, '').slice(-10)

  // GitHub
  const githubMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/)
  if (githubMatch) result.github = githubMatch[0]

  // LinkedIn
  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/)
  if (linkedinMatch) result.linkedin = linkedinMatch[0]

  // Graduation year
  const yearMatch = text.match(/20(2[3-9]|3[0-5])/)
  if (yearMatch) result.year_of_graduation = yearMatch[0]

  // Degree type
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

  // Field of study
  const fieldPatterns = [
    { pattern: /computer science/i, value: 'Computer Science' },
    { pattern: /information technology/i, value: 'Information Technology' },
    { pattern: /electronics.*communication|ECE/i, value: 'Electronics & Communication' },
    { pattern: /electrical/i, value: 'Electrical Engineering' },
    { pattern: /mechanical/i, value: 'Mechanical Engineering' },
    { pattern: /civil engineering/i, value: 'Civil Engineering' },
    { pattern: /data science/i, value: 'Data Science' },
    { pattern: /artificial intelligence|AI\/ML|machine learning/i, value: 'AI & ML' },
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
    new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i').test(text)
  ).slice(0, 10)

  // Institution — look for common keywords near college names
  const institutionMatch = text.match(
    /(?:University|Institute|College|IIT|NIT|BITS|VIT|SRM|IIIT|Amity|Manipal|LPU)[^\n,]{0,60}/i
  )
  if (institutionMatch) result.institution = institutionMatch[0].trim()

  // Full name — first non-empty line that looks like a name (2-4 words, no numbers)
  for (const line of lines.slice(0, 8)) {
    if (/^[A-Za-z]+(?: [A-Za-z]+){1,3}$/.test(line) && line.length > 4 && line.length < 50) {
      result.full_name = line
      break
    }
  }

  return result
}
