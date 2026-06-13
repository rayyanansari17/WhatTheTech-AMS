export function parseResumeText(text) {
  const result = {
    full_name: null,
    email: null,
    phone: null,
    institution: null,
    degree_type: null,       // 'bachelors' | 'masters' | 'phd' | 'diploma'
    field_of_study: null,    // exact FIELDS_OF_STUDY value
    year_of_graduation: null,
    year_of_study: null,     // '1'|'2'|'3'|'4'|'alumni' (inferred)
    github: null,
    linkedin: null,
    bio: null,               // extracted from Summary/Profile section
    skills: [],
    role_type: [],           // inferred: 'frontend'|'backend'|'mobile'|'aiml'|'designer'
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // ── Email ──────────────────────────────────────────────────────────────────
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) result.email = emailMatch[0]

  // ── Phone (Indian 10-digit) ────────────────────────────────────────────────
  const phoneMatch = text.match(/(?:\+91[-\s]?)?[6-9]\d{9}/)
  if (phoneMatch) result.phone = phoneMatch[0].replace(/\D/g, '').slice(-10)

  // ── GitHub ─────────────────────────────────────────────────────────────────
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/)
  if (githubMatch) result.github = 'https://github.com/' + githubMatch[1]

  // ── LinkedIn ───────────────────────────────────────────────────────────────
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/)
  if (linkedinMatch) result.linkedin = 'https://linkedin.com/in/' + linkedinMatch[1]

  // ── Graduation year — pick the latest year in range 2020–2035 ─────────────
  const yearMatches = [...text.matchAll(/\b(20(?:2[0-9]|3[0-5]))\b/g)].map(m => m[1])
  if (yearMatches.length > 0) {
    result.year_of_graduation = yearMatches.sort().pop()
  }

  // ── Year of study (inferred from graduation year) ──────────────────────────
  if (result.year_of_graduation) {
    const currentYear = new Date().getFullYear()
    const gradYear = parseInt(result.year_of_graduation)
    const yearsLeft = gradYear - currentYear
    if (gradYear < currentYear) {
      result.year_of_study = 'alumni'
    } else if (yearsLeft === 0) {
      result.year_of_study = '4'  // graduating this year → final year
    } else if (yearsLeft === 1) {
      result.year_of_study = '3'
    } else if (yearsLeft === 2) {
      result.year_of_study = '2'
    } else {
      result.year_of_study = '1'
    }
  }

  // ── Degree type — output form values directly ──────────────────────────────
  const degreePatterns = [
    { pattern: /\bPh\.?D\b/i,                                          value: 'phd' },
    { pattern: /\bM\.?Tech\b|\bMaster of Technology\b/i,               value: 'masters' },
    { pattern: /\bM\.?S\.?\b|\bMaster of Science\b/i,                  value: 'masters' },
    { pattern: /\bMBA\b|\bMaster of Business\b/i,                      value: 'masters' },
    { pattern: /\bMCA\b|\bMaster of Computer\b/i,                      value: 'masters' },
    { pattern: /\bM\.?Sc\b/i,                                          value: 'masters' },
    { pattern: /\bB\.?Tech\b|\bBachelor of Technology\b/i,             value: 'bachelors' },
    { pattern: /\bB\.?E\.?\b|\bBachelor of Engineering\b/i,            value: 'bachelors' },
    { pattern: /\bBCA\b/i,                                             value: 'bachelors' },
    { pattern: /\bBBA\b/i,                                             value: 'bachelors' },
    { pattern: /\bB\.?Sc\b|\bBachelor of Science\b/i,                  value: 'bachelors' },
    { pattern: /\bB\.?Com\b|\bBachelor of Commerce\b/i,                value: 'bachelors' },
    { pattern: /\bLLB\b|\bBachelor of Law\b/i,                         value: 'bachelors' },
    { pattern: /\bDiploma\b/i,                                         value: 'diploma' },
  ]
  for (const { pattern, value } of degreePatterns) {
    if (pattern.test(text)) { result.degree_type = value; break }
  }

  // ── Field of study — output exact FIELDS_OF_STUDY values ──────────────────
  const fieldPatterns = [
    { pattern: /artificial intelligence|AI\/ML|machine learning/i,     value: 'Artificial Intelligence and Machine Learning' },
    { pattern: /computer science/i,                                    value: 'Computer Science and Engineering' },
    { pattern: /software engineering/i,                                value: 'Software Engineering' },
    { pattern: /information technology/i,                              value: 'Information Technology' },
    { pattern: /electronics.*communication|\bECE\b/i,                  value: 'Electronics and Communication Engineering' },
    { pattern: /electrical engineering/i,                              value: 'Electrical Engineering' },
    { pattern: /mechanical engineering/i,                              value: 'Mechanical Engineering' },
    { pattern: /civil engineering/i,                                   value: 'Civil Engineering' },
    { pattern: /chemical engineering/i,                                value: 'Chemical Engineering' },
    { pattern: /aerospace/i,                                           value: 'Aerospace Engineering' },
    { pattern: /data science/i,                                        value: 'Data Science' },
    { pattern: /bioinformatics/i,                                      value: 'Bioinformatics' },
    { pattern: /biotechnology/i,                                       value: 'Biotechnology' },
    { pattern: /cybersecurity|cyber security/i,                        value: 'Cybersecurity' },
    { pattern: /\bphysics\b/i,                                         value: 'Physics' },
    { pattern: /\bmathematics\b|applied math/i,                        value: 'Mathematics' },
    { pattern: /\bstatistics\b/i,                                      value: 'Statistics' },
    { pattern: /\bchemistry\b/i,                                       value: 'Chemistry' },
    { pattern: /\bbiology\b/i,                                         value: 'Biology' },
    { pattern: /commerce|business administration/i,                    value: 'Commerce / Business Administration' },
    { pattern: /\beconomics\b/i,                                       value: 'Economics' },
    { pattern: /\bfinance\b/i,                                         value: 'Finance' },
    { pattern: /\bmarketing\b/i,                                       value: 'Marketing' },
    { pattern: /\bmanagement\b/i,                                      value: 'Management' },
    { pattern: /\blaw\b|\bLLB\b/i,                                     value: 'Law' },
    { pattern: /\bmedicine\b|\bMBBS\b/i,                               value: 'Medicine / MBBS' },
    { pattern: /\bpharmacy\b/i,                                        value: 'Pharmacy' },
    { pattern: /\barchitecture\b/i,                                    value: 'Architecture' },
    { pattern: /media.*communication/i,                                value: 'Media and Communication' },
    { pattern: /\bpsychology\b/i,                                      value: 'Psychology' },
    { pattern: /\bdesign\b/i,                                          value: 'Design' },
  ]
  for (const { pattern, value } of fieldPatterns) {
    if (pattern.test(text)) { result.field_of_study = value; break }
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  const knownSkills = [
    'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express.js',
    'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Python', 'JavaScript',
    'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift',
    'PHP', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'GraphQL',
    'REST API', 'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase', 'Supabase',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Git',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'Data Science', 'Pandas', 'NumPy', 'Scikit-learn', 'Figma', 'Flutter', 'React Native',
    'Blockchain', 'Solidity', 'Unity', 'Android', 'iOS', 'NLP', 'Computer Vision',
  ]
  result.skills = knownSkills.filter(skill =>
    new RegExp(`\\b${skill.replace(/[.+]/g, c => `\\${c}`)}\\b`, 'i').test(text)
  ).slice(0, 10)

  // ── Role type (inferred from skills + title keywords) ──────────────────────
  const roleSignals = {
    frontend: ['React', 'Vue.js', 'Angular', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'JavaScript', 'TypeScript'],
    backend:  ['Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'PHP', 'Go', 'Java', 'PostgreSQL', 'MySQL', 'REST API', 'GraphQL'],
    mobile:   ['Flutter', 'React Native', 'Android', 'iOS', 'Kotlin', 'Swift'],
    aiml:     ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Science', 'NLP', 'Computer Vision', 'Scikit-learn', 'Pandas', 'NumPy'],
    designer: ['Figma', 'Adobe XD', 'UI/UX'],
  }
  const roleCounts = {}
  for (const [role, signals] of Object.entries(roleSignals)) {
    roleCounts[role] = signals.filter(s =>
      new RegExp(`\\b${s.replace(/[.+/]/g, c => `\\${c}`)}\\b`, 'i').test(text)
    ).length
  }

  // Boost from explicit title keywords
  if (/frontend|front-end|front end/i.test(text))                          roleCounts.frontend  = (roleCounts.frontend  || 0) + 3
  if (/backend|back-end|back end/i.test(text))                             roleCounts.backend   = (roleCounts.backend   || 0) + 3
  if (/full.?stack/i.test(text))                                           { roleCounts.frontend = (roleCounts.frontend || 0) + 2; roleCounts.backend = (roleCounts.backend || 0) + 2 }
  if (/mobile developer|android developer|ios developer/i.test(text))     roleCounts.mobile    = (roleCounts.mobile    || 0) + 3
  if (/ui\/ux|ux designer|product designer/i.test(text))                   roleCounts.designer  = (roleCounts.designer  || 0) + 3
  if (/machine learning engineer|ai engineer|data scientist|ml engineer/i.test(text)) roleCounts.aiml = (roleCounts.aiml || 0) + 3

  result.role_type = Object.entries(roleCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([role]) => role)

  // ── Institution ────────────────────────────────────────────────────────────
  const institutionMatch = text.match(
    /(?:University|Institute of Technology|Institute|College|IIT|NIT|BITS|VIT|SRM|IIIT|Amity|Manipal|LPU|Osmania)[^,\n]{0,60}/i
  )
  if (institutionMatch) {
    result.institution = institutionMatch[0].trim().replace(/[#*_`|]+/g, '').trim()
  }

  // ── Bio (extract from Summary / Profile / Objective section) ─────────────
  const bioRe = /(?:^|\n)[ \t]*(?:#{1,3}[ \t]+)?(?:summary|professional summary|profile|objective|about(?:\s+me)?|overview)[ \t]*:?[ \t]*\n+([\s\S]{30,600}?)(?=\n[ \t]*#{1,3}[ \t]|\n[A-Z][A-Z ]{3,}\n|$)/i
  const bioMatch = text.match(bioRe)
  if (bioMatch) {
    const bio = bioMatch[1]
      .replace(/[#*_`]/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (bio.length >= 30) result.bio = bio.slice(0, 400)
  }

  // ── Full name (first 2–4 word line near the top) ───────────────────────────
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
