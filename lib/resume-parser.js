export function parseResumeText(text) {
  const result = {
    full_name: null,
    email: null,
    phone: null,
    institution: null,
    degree_type: null,       // 'bachelors' | 'masters' | 'phd' | 'diploma'
    field_of_study: null,    // exact FIELDS_OF_STUDY value
    year_of_graduation: null,
    year_of_study: null,     // '1'|'2'|'3'|'4'|'alumni'
    github: null,
    linkedin: null,
    bio: null,
    skills: [],
    role_type: [],           // 'frontend'|'backend'|'mobile'|'aiml'|'designer'
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // ── Email ──────────────────────────────────────────────────────────────────
  // Handles hyphenated domains (name@my-company.com)
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) result.email = emailMatch[0].toLowerCase()

  // ── Phone — Indian mobile (starts 6–9, handles spaces/hyphens mid-number) ──
  const phoneMatch = text.match(/(?:\+91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}/)
  if (phoneMatch) result.phone = phoneMatch[0].replace(/\D/g, '').slice(-10)

  // ── GitHub ─────────────────────────────────────────────────────────────────
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i)
  if (githubMatch) result.github = 'https://github.com/' + githubMatch[1]

  // ── LinkedIn ───────────────────────────────────────────────────────────────
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i)
  if (linkedinMatch) result.linkedin = 'https://linkedin.com/in/' + linkedinMatch[1]

  // ── Graduation year ────────────────────────────────────────────────────────
  // Contextual patterns first ("Expected 2026", "Batch of 2025") — more reliable
  // than just picking the latest year, which can grab a project year instead.
  const yearContextPatterns = [
    /(?:expected|graduating|batch\s+of|passout|pass\s*out|grad(?:uation)?)[^\d]*\b(20[2-3]\d)\b/i,
    /\b(20[2-3]\d)\b[^\d]*(?:expected|passout|batch)/i,
    /(?:passing\s+out|graduating)\s+in\s+\b(20[2-3]\d)\b/i,
  ]
  let gradYear = null
  for (const pat of yearContextPatterns) {
    const m = text.match(pat)
    if (m) { gradYear = m[1]; break }
  }
  if (!gradYear) {
    const allYears = [...text.matchAll(/\b(20(?:2[0-9]|3[0-5]))\b/g)].map(m => m[1])
    if (allYears.length > 0) gradYear = allYears.sort().pop()
  }
  result.year_of_graduation = gradYear

  // ── Year of study (inferred from graduation year) ──────────────────────────
  if (result.year_of_graduation) {
    const currentYear = new Date().getFullYear()
    const gYear = parseInt(result.year_of_graduation)
    const yearsLeft = gYear - currentYear
    if (gYear < currentYear)  result.year_of_study = 'alumni'
    else if (yearsLeft === 0) result.year_of_study = '4'
    else if (yearsLeft === 1) result.year_of_study = '3'
    else if (yearsLeft === 2) result.year_of_study = '2'
    else                      result.year_of_study = '1'
  }

  // ── Degree type — outputs form-ready values directly ──────────────────────
  // BTech/MTech (no space/dot) added; B.Arch, B.Des, M.Com, LLM added
  const degreePatterns = [
    { pattern: /\bPh\.?\s*D\b|\bDoctor\s+of\s+Philosophy\b/i,                value: 'phd' },
    { pattern: /\bM\.?\s*Tech\b|\bMTech\b|\bMaster\s+of\s+Technology\b/i,    value: 'masters' },
    { pattern: /\bM\.?\s*E\.?\b|\bMaster\s+of\s+Engineering\b/i,             value: 'masters' },
    { pattern: /\bM\.?\s*S\.?\b|\bMaster\s+of\s+Science\b/i,                 value: 'masters' },
    { pattern: /\bMBA\b|\bMaster\s+of\s+Business/i,                          value: 'masters' },
    { pattern: /\bMCA\b|\bMaster\s+of\s+Computer/i,                          value: 'masters' },
    { pattern: /\bM\.?\s*Sc\b|\bMSc\b/i,                                     value: 'masters' },
    { pattern: /\bM\.?\s*Com\b|\bMaster\s+of\s+Commerce\b/i,                 value: 'masters' },
    { pattern: /\bLLM\b|\bMaster\s+of\s+Law\b/i,                             value: 'masters' },
    { pattern: /\bB\.?\s*Tech\b|\bBTech\b|\bBachelor\s+of\s+Technology\b/i,  value: 'bachelors' },
    { pattern: /\bB\.?\s*E\.?\b|\bBachelor\s+of\s+Engineering\b|\bBEng\b/i,  value: 'bachelors' },
    { pattern: /\bB\.?\s*Arch\b|\bBachelor\s+of\s+Architecture\b/i,          value: 'bachelors' },
    { pattern: /\bB\.?\s*Des\b|\bBachelor\s+of\s+Design\b/i,                 value: 'bachelors' },
    { pattern: /\bBCA\b|\bBachelor\s+of\s+Computer\s+App/i,                  value: 'bachelors' },
    { pattern: /\bBBA\b|\bBachelor\s+of\s+Business\b/i,                      value: 'bachelors' },
    { pattern: /\bB\.?\s*Sc\b|\bBSc\b|\bBachelor\s+of\s+Science\b/i,        value: 'bachelors' },
    { pattern: /\bB\.?\s*Com\b|\bBachelor\s+of\s+Commerce\b/i,               value: 'bachelors' },
    { pattern: /\bLLB\b|\bBachelor\s+of\s+Law\b/i,                           value: 'bachelors' },
    { pattern: /\bMBBS\b/i,                                                   value: 'bachelors' },
    { pattern: /\bDiploma\b/i,                                                value: 'diploma' },
  ]
  for (const { pattern, value } of degreePatterns) {
    if (pattern.test(text)) { result.degree_type = value; break }
  }

  // ── Field of study — outputs exact FIELDS_OF_STUDY values ─────────────────
  // CSE, EEE, ECE abbreviations added; risky short ones (IT, CS) avoided
  const fieldPatterns = [
    { pattern: /artificial intelligence|AI\/ML|machine learning/i,                              value: 'Artificial Intelligence and Machine Learning' },
    { pattern: /\bCSE\b|computer\s*science\s*(?:&|and)?\s*engineering/i,                       value: 'Computer Science and Engineering' },
    { pattern: /computer science/i,                                                             value: 'Computer Science and Engineering' },
    { pattern: /software engineering/i,                                                         value: 'Software Engineering' },
    { pattern: /information technology/i,                                                       value: 'Information Technology' },
    { pattern: /\bECE\b|electronics\s*(?:&|and)\s*communication/i,                             value: 'Electronics and Communication Engineering' },
    { pattern: /\bEEE\b|electrical\s*(?:&|and)\s*electronics/i,                                value: 'Electrical Engineering' },
    { pattern: /electrical engineering/i,                                                       value: 'Electrical Engineering' },
    { pattern: /mechanical engineering|\bmech\b/i,                                              value: 'Mechanical Engineering' },
    { pattern: /civil engineering/i,                                                            value: 'Civil Engineering' },
    { pattern: /chemical engineering/i,                                                         value: 'Chemical Engineering' },
    { pattern: /aerospace|aeronautical/i,                                                       value: 'Aerospace Engineering' },
    { pattern: /data science/i,                                                                 value: 'Data Science' },
    { pattern: /bioinformatics/i,                                                               value: 'Bioinformatics' },
    { pattern: /biotechnology/i,                                                                value: 'Biotechnology' },
    { pattern: /cybersecurity|cyber security|information security/i,                            value: 'Cybersecurity' },
    { pattern: /\bphysics\b/i,                                                                  value: 'Physics' },
    { pattern: /\bmathematics\b|applied math|\bmaths?\b/i,                                      value: 'Mathematics' },
    { pattern: /\bstatistics\b/i,                                                               value: 'Statistics' },
    { pattern: /\bchemistry\b/i,                                                                value: 'Chemistry' },
    { pattern: /\bbiology\b/i,                                                                  value: 'Biology' },
    { pattern: /commerce|business administration/i,                                             value: 'Commerce / Business Administration' },
    { pattern: /\beconomics\b/i,                                                                value: 'Economics' },
    { pattern: /\bfinance\b/i,                                                                  value: 'Finance' },
    { pattern: /\bmarketing\b/i,                                                                value: 'Marketing' },
    { pattern: /\bmanagement\b/i,                                                               value: 'Management' },
    { pattern: /\blaw\b|\bLLB\b/i,                                                              value: 'Law' },
    { pattern: /\bmedicine\b|\bMBBS\b/i,                                                        value: 'Medicine / MBBS' },
    { pattern: /\bpharmacy\b/i,                                                                 value: 'Pharmacy' },
    { pattern: /\barchitecture\b/i,                                                             value: 'Architecture' },
    { pattern: /media.*communication/i,                                                         value: 'Media and Communication' },
    { pattern: /\bpsychology\b/i,                                                               value: 'Psychology' },
    { pattern: /\bdesign\b/i,                                                                   value: 'Design' },
  ]
  for (const { pattern, value } of fieldPatterns) {
    if (pattern.test(text)) { result.field_of_study = value; break }
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  const knownSkills = [
    // Frontend
    'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte',
    'HTML', 'CSS', 'SCSS', 'Tailwind CSS', 'Bootstrap', 'JavaScript', 'TypeScript',
    // Backend
    'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'PHP', 'Go', 'Rust',
    // Languages
    'Python', 'Java', 'C++', 'C#', 'Kotlin', 'Swift', 'Dart', 'Scala', 'R', 'MATLAB',
    // Database
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase',
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Git', 'Linux', 'CI/CD',
    // AI/ML
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'NLP', 'Computer Vision', 'LangChain',
    // Mobile
    'Flutter', 'React Native', 'Android', 'iOS',
    // Tools & Other
    'GraphQL', 'REST API', 'Figma', 'Postman', 'Selenium', 'Playwright',
    'Blockchain', 'Solidity', 'Unity',
  ]

  // Smart boundary matching: \b for word-char boundaries, lookahead/behind for
  // skills ending in non-word chars (C++, C#, CI/CD, REST API)
  result.skills = knownSkills.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const prefix = /^\w/.test(skill) ? '\\b' : '(?<![\\w])'
    const suffix = /\w$/.test(skill) ? '\\b' : '(?![\\w])'
    return new RegExp(`${prefix}${escaped}${suffix}`, 'i').test(text)
  }).slice(0, 6)

  // ── Role type (inferred from skills + title keywords) ──────────────────────
  const roleSignals = {
    frontend: ['React', 'Vue.js', 'Angular', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'JavaScript', 'TypeScript', 'Svelte'],
    backend:  ['Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'PHP', 'Go', 'Java', 'PostgreSQL', 'MySQL', 'REST API', 'GraphQL'],
    mobile:   ['Flutter', 'React Native', 'Android', 'iOS', 'Kotlin', 'Swift', 'Dart'],
    aiml:     ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Science', 'NLP', 'Computer Vision', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'LangChain'],
    designer: ['Figma', 'Adobe XD', 'UI/UX', 'SCSS'],
  }
  const roleCounts = {}
  for (const [role, signals] of Object.entries(roleSignals)) {
    roleCounts[role] = signals.filter(s => {
      const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const prefix = /^\w/.test(s) ? '\\b' : '(?<![\\w])'
      const suffix = /\w$/.test(s) ? '\\b' : '(?![\\w])'
      return new RegExp(`${prefix}${escaped}${suffix}`, 'i').test(text)
    }).length
  }

  if (/frontend|front-end|front end/i.test(text))                                              roleCounts.frontend = (roleCounts.frontend || 0) + 3
  if (/backend|back-end|back end/i.test(text))                                                 roleCounts.backend  = (roleCounts.backend  || 0) + 3
  if (/full.?stack/i.test(text))                                                               { roleCounts.frontend = (roleCounts.frontend || 0) + 2; roleCounts.backend = (roleCounts.backend || 0) + 2 }
  if (/mobile developer|android developer|ios developer/i.test(text))                         roleCounts.mobile   = (roleCounts.mobile   || 0) + 3
  if (/ui\/ux|ux designer|product designer/i.test(text))                                       roleCounts.designer = (roleCounts.designer || 0) + 3
  if (/machine learning engineer|ai engineer|data scientist|ml engineer/i.test(text))         roleCounts.aiml     = (roleCounts.aiml     || 0) + 3

  result.role_type = Object.entries(roleCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([role]) => role)

  // ── Institution — specific brand patterns first, then generic ──────────────
  // Each pattern is precise to avoid false matches from surrounding text
  const institutionPatterns = [
    /\bIIT\s+[A-Za-z]+(?:\s+[A-Za-z]+)*/i,                                // IIT Bombay, IIT Madras
    /\bNIT\s+[A-Za-z]+(?:\s+[A-Za-z]+)*/i,                                // NIT Warangal, NIT Trichy
    /\bBITS\s+Pilani[^\n,]*/i,                                             // BITS Pilani, BITS Pilani - Hyderabad
    /\bIIIT\s+[A-Za-z]+(?:\s+[A-Za-z]+)*/i,                               // IIIT Hyderabad
    /\bVIT\s+(?:University|Chennai|Vellore|Bhopal|AP|Pune|[A-Za-z]+)/i,   // VIT Vellore, VIT Chennai
    /\bSRM\s+(?:University|Institute|[A-Za-z]+)/i,
    /\bAmity\s+(?:University|[A-Za-z]+)/i,
    /\bManipal\s+(?:University|Institute|[A-Za-z]+)/i,
    /\bThapar\s+(?:University|Institute)/i,
    /\bAnna\s+University/i,
    /\bOsmania\s+University/i,
    /\bLPU\b|\bLovely\s+Professional\s+University/i,
    /\bPSG\s+(?:College|Tech|Institute)/i,
    /\bJNTU\s*[A-Za-z]*/i,                                                 // JNTU Hyderabad
    /(?:University|Institute\s+of\s+Technology|College\s+of\s+Engineering|College)[^,\n]{0,50}/i,
  ]
  for (const pattern of institutionPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.institution = match[0].trim().replace(/[#*_`|]+/g, '').trim()
      break
    }
  }

  // ── Bio — extract from Summary / Profile / Objective / Career Objective ────
  const bioRe = /(?:^|\n)[ \t]*(?:#{1,3}[ \t]+)?(?:summary|professional summary|career\s+objective|profile|objective|about(?:\s+me)?|overview)[ \t]*:?[ \t]*\n+([\s\S]{30,600}?)(?=\n[ \t]*#{1,3}[ \t]|\n[A-Z][A-Z ]{3,}\n|$)/i
  const bioMatch = text.match(bioRe)
  if (bioMatch) {
    const bio = bioMatch[1]
      .replace(/[#*_`]/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (bio.length >= 30) result.bio = bio.slice(0, 400)
  }

  // ── Full name — skip section headers, normalize Title Case ────────────────
  const sectionHeaders = /^(education|experience|skills|projects|summary|objective|profile|contact|work|career|achievements|certifications|languages|interests|hobbies|references|publications|awards|volunteer|internship)$/i
  for (const line of lines.slice(0, 10)) {
    const words = line.split(/\s+/)
    if (
      words.length >= 2 &&
      words.length <= 4 &&
      /^[A-Za-z]+(?: [A-Za-z]+){1,3}$/.test(line) &&
      line.length >= 5 &&
      line.length < 60 &&
      !sectionHeaders.test(line.trim()) &&
      !/\d/.test(line) &&
      !/[@|•\/\\]/.test(line)
    ) {
      result.full_name = line
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
      break
    }
  }

  return result
}
