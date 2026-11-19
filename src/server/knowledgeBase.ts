/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EducationalMaterial } from '../types';

export const VERIFIED_EDUCATIONAL_MATERIALS: EducationalMaterial[] = [
  {
    id: 'mat_color_desensitization',
    title: 'Sensory Ladder: Step-by-Step Color & Visual Tolerance (e.g., Red-Coded Items)',
    domain: 'sensory_play',
    sourceFramework: 'Kinda Care Companion Guide',
    referralStandard: 'Gradual Sensory Habituation Ladder',
    ageRange: '3 - 6 Years',
    description: 'Gentle, step-by-step support protocol for children who avoid or push away high-stimulus visual colors (such as bright red tiles or objects). Uses gradual pairing and play-based exposure without forcing.',
    activities: [
      'Stage 1: Neutral Pairing - Keep the red tile 30cm away on a neutral placemat while child plays with favored green or blue tiles.',
      'Stage 2: Peekaboo Reveal - Hide the red tile beneath a neutral cloth and let the child lift the cloth on their own terms.',
      'Stage 3: Tool Touch - Use a favorite plastic spoon, wooden stick, or toy car to touch or push the red tile without direct fingertip contact.',
      'Stage 4: Co-sorting with caregiver - Caregiver places red tile into the bin first while singing a calming rhythm, inviting child to celebrate with a high-five.'
    ],
    caregiverGuidance: 'Never force the child to touch or hold an aversive stimulus. If the child pushes items away or un-sorts them, validate gently: "Red is taking a little nap today!" Praise every calm moment.',
    sensoryTips: 'High-contrast colors can feel visually intense for sensitive nervous systems. Gradual, unhurried play over 2 to 4 weeks helps build comfort.',
    therapistRationale: 'Gradual, non-forced exposure during calm co-play supports comfortable visual exploration.',
    keywords: ['red', 'color puzzle', 'tiles', 'sensory aversion', 'restless', 'alizipangua', 'tolerance', 'visual']
  },
  {
    id: 'mat_independent_puzzle_mastery',
    title: 'Milestone Consolidation: Independent Puzzle Solving & Spatial Reasoning',
    domain: 'motor',
    sourceFramework: 'Kinda Care Companion Guide',
    referralStandard: 'Spatial Play & Bilateral Hand Coordination',
    ageRange: '3 - 7 Years',
    description: 'Guidelines for celebrating and stretching independent play when a child completes puzzles or construction kits completely alone.',
    activities: [
      'Rotate & Fit Challenge: Flip one puzzle piece upside down or turn the board 90 degrees to foster mental spatial rotation.',
      'Mystery Piece Delivery: Hide 2 pieces around the living room and turn puzzle completion into a mini treasure hunt.',
      'Storyteller Puzzle: Ask child: "What sound does this lion piece make when it finds its home on the board?"',
      'Peer or Sibling Co-play: Invite child to be the "Puzzle Teacher" guiding another child or teddy bear.'
    ],
    caregiverGuidance: 'When a child does a puzzle kit completely alone, provide descriptive praise rather than generic "good job". Say: "You looked closely at the edges and tried three times until it fit! You worked through that puzzle all by yourself."',
    sensoryTips: 'Tactile resistance of wooden or thick cardboard puzzle pieces provides calming feedback to fingers and hands.',
    therapistRationale: 'Independent completion of multi-piece puzzles engages working memory, bilateral hand coordination, and sustained attention.',
    keywords: ['puzzle', 'alone', 'independent', 'kit', 'spatial', 'motor']
  },
  {
    id: 'mat_speech_expressive_song',
    title: 'Language Acceleration: Singing with Complete Words & Melodic Rhythm',
    domain: 'singing',
    sourceFramework: 'Kinda Care Companion Guide',
    referralStandard: 'Expressive Language & Melodic Rhythm',
    ageRange: '2 - 5 Years',
    description: 'Playful rhythm and singing guide to encourage expressive vocabulary and clarity when a child transitions from humming to singing complete words.',
    activities: [
      'Call & Response Song: Caregiver sings the first phrase ("Twinkle, twinkle little..."), pauses with wide eyes, and waits 3 seconds for the child to sing the next word ("...star!").',
      'Swahili & English Rhythm Clapping: Sing "Mimi na wewe, rafiki wa kweli" while clapping hands together, tapping knees, or shaking a shaker.',
      'Action Mirroring: Sing "Head, Shoulders, Knees and Toes" or "Tembo mkubwa mwenye masikio makubwa" while acting out the animal gestures.',
      'Microphone Pretend Play: Use a rolled-up cardboard tube or wooden spoon as a microphone to boost vocal confidence.'
    ],
    caregiverGuidance: 'Notice words articulated clearly during song. Singing and steady rhythm help many children practice word sounds playfully without feeling quizzed.',
    sensoryTips: 'Rhythm and music support listening attention and ease hesitation during direct questioning.',
    therapistRationale: 'Singing multi-word phrases helps practice breath control, rhythm, and word sequencing in a low-pressure routine.',
    keywords: ['singing', 'words', 'speech', 'talking', 'language', 'song', 'nursery rhymes', 'swahili']
  },
  {
    id: 'mat_reading_kenyan_storytelling',
    title: 'Contextual Storytelling & Interactive Picture Reading (Hadithi Hadithi)',
    domain: 'reading',
    sourceFramework: 'Kinda Care Clinical OT',
    referralStandard: 'Kenyan CBC Dialogic Literacy',
    ageRange: '3 - 6 Years',
    description: 'Bilingual, interactive reading activities using everyday Kenyan animals, nature, and home routines to build narrative comprehension and conversational turn-taking.',
    activities: [
      'Hadithi Hadithi Starter: Start with "Hadithi hadithi!" Child responds: "Hadithi njoo!"',
      'Sound Hunter: Point to pictures of animals (Simba the lion, Kuku the chicken) and ask child to make the sound louder, then whisper it.',
      'Predict What Comes Next: Before turning the page, ask: "What do you think Hare is going to do now?"',
      'Living Room Book Walk: Place 3 picture books on the rug and let the child "hop" like a frog from one story to the next.'
    ],
    caregiverGuidance: 'Reading with young children is about conversation, not just reading every printed word on the page. Ask open questions about the drawings.',
    therapistRationale: 'Dialogic reading increases vocabulary uptake by 300% compared to passive listening and strengthens joint attention.',
    keywords: ['reading', 'story', 'hadithi', 'books', 'pictures', 'vocabulary', 'words']
  },
  {
    id: 'mat_spelling_sensory_letters',
    title: 'Sensory Spelling: Tactile Letter Exploration Without Pencil Pressure',
    domain: 'spelling',
    sourceFramework: 'Kinda Care Clinical OT',
    referralStandard: 'Multi-Sensory Phonemic Readiness',
    ageRange: '4 - 7 Years',
    description: 'Playful spelling methods that build phonics and letter recognition through touch, movement, and household materials before formal pencil drills.',
    activities: [
      'Flour or Sand Tray Tracing: Spread clean maize flour or sand on a tray and trace letters with index fingers while saying the phonetic sound (e.g., "/s/ like snake").',
      'Body Letter Shapes: Use arms and legs to make the letter "T", "L", or "O".',
      'Playdough Letter Sculpting: Roll playdough into "snakes" to bend into the first letter of the child’s name.',
      'Target Letter Splash: Draw 3 letters on paper and have child tap the letter you sound out with a soft beanbag or sponge.'
    ],
    caregiverGuidance: 'Focus on letter sounds (phonemes) rather than letter names. Celebrate attempts enthusiastically without highlighting errors.',
    sensoryTips: 'Tactile input reinforces visual memory for children who resist handwriting drills.',
    therapistRationale: 'Multi-sensory phonics bypasses fine-motor fatigue and links auditory-motor pathways in the brain.',
    keywords: ['spelling', 'letters', 'phonics', 'writing', 'sand', 'playdough', 'tracing', 'maize flour']
  },
  {
    id: 'mat_drawing_emotional_expression',
    title: 'Expressive Drawing & Fine Motor Joy: Crayons, Water & Finger Colors',
    domain: 'drawing',
    sourceFramework: 'Kinda Care Clinical OT',
    referralStandard: 'Pre-Writing Proximal Stability',
    ageRange: '2 - 6 Years',
    description: 'Explorative mark-making, grip strength development, and emotional decompression through drawing and color play.',
    activities: [
      'Big Movement Floor Drawing: Tape a large brown paper or cardboard box flat on the floor and let child draw broad arcs and circles.',
      'Water Painting on Pavement or Veranda: Give child a cup of clean water and paintbrush to "paint" dark wet patterns that dry like magic in the sun.',
      'Emotion Scribble: Draw happy faces, sleepy faces, and excited swirls together to name feelings.',
      'Finger Stamping with Leaves: Collect fallen leaves from outside, dip in washable watercolor, and press onto paper.'
    ],
    caregiverGuidance: 'Allow the child to hold the crayon with their natural grip. Do not force adult pincer grip before hand arch muscles are developed.',
    therapistRationale: 'Bilateral hand integration and shoulder stability develop through large-scale floor drawing, directly preparing hands for fine writing.',
    keywords: ['drawing', 'painting', 'crayons', 'art', 'motor', 'grip', 'leaves', 'veranda']
  },
  {
    id: 'mat_caregiver_rest_regulation',
    title: 'Caregiver Nervous System Reset: The 2-Minute Breathing & Rest Mode',
    domain: 'caregiver_wellness',
    sourceFramework: 'Kinda Care Clinical OT',
    referralStandard: 'Co-Regulation & Vagal Recovery',
    ageRange: 'Caregivers & All Ages',
    description: 'Protocol triggered when a parent or caregiver expresses exhaustion, burnout, or sensory overwhelm. Prioritizes caregiver regulation over child lesson delivery.',
    activities: [
      'Exhale Longer Than Inhale: 4 count breath in, 6 count breath out through pursed lips.',
      'Horizontal Pause: Caregiver lies on the couch while child looks at books or plays with soft toys next to them.',
      'Quiet Water Sip: Taking 5 mindful sips of cool water.',
      'Permission to Pause: Zero guilt about putting away toys or skipping today’s structured milestone activity.'
    ],
    caregiverGuidance: 'A regulated caregiver is the primary developmental tool. When you are exhausted, your child senses the tension. Taking a break is therapeutic practice.',
    therapistRationale: 'Co-regulation requires the caregiver’s vagal tone to be balanced. Pushing activities during caregiver burnout increases parent-child relational friction.',
    keywords: ['exhausted', 'tired', 'overwhelmed', 'hard day', 'burnout', 'break', 'rest', 'nimechoka', 'tumechoka']
  },
  {
    id: 'mat_who_cst_joint_engagement',
    title: 'WHO CST: Everyday Home Routines & Joint Engagement (No Bought Toys Needed)',
    domain: 'sensory_play',
    sourceFramework: 'WHO Caregiver Skills Training (CST)',
    referralStandard: 'WHO CST Modules 1–4: Engagement & Communication in Daily Routines',
    ageRange: '2 - 9 Years (Developmental Delays)',
    description: 'World Health Organization Caregiver Skills Training (CST) protocol turning ordinary Kenyan household moments—mealtime, dressing, washing cups, sweeping—into rich joint-attention and communication opportunities without expensive kits.',
    activities: [
      'Notice & Join (Face-to-Face): Sit at your child’s eye level during snack or cup play; watch what already holds their interest for 10 seconds before speaking.',
      'Imitate & Wait 5 Seconds: Copy a harmless sound or tap your child makes with a wooden spoon, then pause quietly for 5 full seconds to invite a turn back.',
      'Narrate Simple Words: Use 1–3 clear words matching what the child is looking at ("Kikombe!", "Maji!", "Pour water") rather than firing rapid quiz questions.',
      'Predictable Home Routine Choices: Hold up two safe choices (e.g., two cups or two fruits) so the child communicates via gaze, pointing, gesture, or word.'
    ],
    caregiverGuidance: 'No commercial therapy kit is required. WHO CST emphasizes short 5-minute shared moments inside chores and meals you already do every day.',
    sensoryTips: 'Reducing background TV/radio noise during 5-minute routine play noticeably increases eye contact and vocal attempts.',
    therapistRationale: 'WHO Caregiver Skills Training is an evidence-based, open-access global intervention proven in low-resource settings to improve joint engagement, child communication, and caregiver confidence.',
    keywords: ['who', 'cst', 'caregiver skills training', 'no toys', 'everyday', 'routine', 'mealtime', 'joint engagement', 'communication', 'eye level', 'wait', 'household']
  },
  {
    id: 'mat_who_cst_positive_behavior',
    title: 'WHO CST: Understanding & Guiding Challenging Behavior Gently',
    domain: 'motor',
    sourceFramework: 'WHO Caregiver Skills Training (CST)',
    referralStandard: 'WHO CST Modules 6–8: Positive Behavior Support & Self-Care',
    ageRange: '2 - 9 Years',
    description: 'WHO CST behavior-as-communication framework helping caregivers spot triggers behind meltdowns, restlessness, or refusal and respond with calm, non-punitive redirection.',
    activities: [
      'ABC Check (Before-Behavior-After): Notice whether noise, hunger, tiredness, or sudden transitions happened right before restlessness or refusal.',
      '2-Minute Transition Warning: Give a gentle heads-up before changing activities ("Two more taps, then we wash hands") or sing a short transition hum.',
      'Tell What TO Do: Replace "Stop running!" with a calm clear action ("Walk slow like a tortoise with Mama").',
      'Catch Small Calms: Immediately praise tiny positive choices ("Thank you for placing the cup gently!").'
    ],
    caregiverGuidance: 'Challenging behavior is rarely stubbornness—it is usually a child saying "this is too loud, too hard, or too sudden for me." Never use harsh or physical discipline.',
    sensoryTips: 'Dim lighting, a soft cloth, or quiet rhythmic humming helps settle an overloaded nervous system faster than verbal lecturing.',
    therapistRationale: 'Positive Behavior Support within WHO CST lowers caregiver-child friction and replaces punitive reactions with predictable co-regulation.',
    keywords: ['who', 'cst', 'behavior', 'meltdown', 'tantrum', 'restless', 'refusing', 'transition', 'crying', 'discipline', 'calm']
  },
  {
    id: 'mat_kenya_dcs_disability_standards',
    title: 'Kenya DCS Disability Manual: Rights-Based Care, Terminology & National Referral Pathways',
    domain: 'protection_referral',
    sourceFramework: 'Kenya DCS Disability Manual',
    referralStandard: 'Kenya Directorate of Children Services & Children Act (2022) Care Standards',
    ageRange: '0 - 18 Years (Kenya Child Protection)',
    description: 'Aligned with the Kenya Directorate of Children Services (DCS) training manual on caring for children with disabilities: promotes dignified person-first language, dispels stigma, safeguards child protection, and maps Kenya’s official assessment and support referral pathways.',
    activities: [
      'Dignified Person-First Language: Refer to "a child with sensory/developmental needs" rather than labeling or stigmatizing terms; reinforce every child’s right to play, belonging, and safety.',
      'EARC Educational Assessment Referral: Connect caregivers to the nearest Sub-County Educational Assessment and Resource Centre (EARC) for free developmental screening and inclusive school placement guidance.',
      'NCPWD Registration Pathway: Guide families on registering with the National Council for Persons with Disabilities (NCPWD) after medical/specialist assessment for assistive devices, tax exemptions, and social protection.',
      'Child Protection & Community Safety: When a family faces neglect, severe crisis, stigma, or unsafe care, escalate respectfully toward the Sub-County Children’s Officer (DCS) or Childline Kenya 116.'
    ],
    caregiverGuidance: 'Under Kenya’s national care standards and the Children Act, developmental differences are never a curse or a parent’s fault. Families have legal rights to healthcare, inclusive education (KISE/EARC), and social support.',
    therapistRationale: 'Aligning AI guidance and specialist escalations with Kenya DCS standards prevents harmful myths, enforces safeguarding boundaries, and connects families to real public Kenyan systems.',
    keywords: ['dcs', 'directorate of children services', 'disability', 'kenya', 'referral', 'earc', 'ncpwd', 'kise', 'rights', 'stigma', 'protection', 'school', 'assessment', '116']
  },
  {
    id: 'mat_unicef_cfc_caregiver_resilience',
    title: 'UNICEF Caring for the Caregiver (CFC): Emotional Resilience & Burnout Prevention',
    domain: 'caregiver_wellness',
    sourceFramework: 'UNICEF Caring for the Caregiver (CFC)',
    referralStandard: 'UNICEF CFC Psychosocial Support Modules (Mental Health & Burnout Prevention)',
    ageRange: 'Parents & Primary Caregivers',
    description: 'Evidence shows up to one-third of parents raising children with developmental delays or disabilities experience severe stress, exhaustion, or depression. Built from UNICEF’s open-access Caring for the Caregiver (CFC) modules to strengthen caregiver mental wellbeing and prevent burnout.',
    activities: [
      'Module 1 — Emotional Check-In (Naming the Load): Gently ask how the caregiver is sleeping, eating, and feeling—normalizing mixed emotions of love, grief, guilt, or exhaustion without judgment.',
      'Module 2 — 3-Minute Grounding & Self-Compassion: Guide a slow shoulder drop, 4-6 breathing, and a kind internal phrase ("I am doing enough today; caring for myself cares for my child").',
      'Module 3 — Mapping a Care Circle: Help the parent identify one trusted person (spouse, auntie, neighbor, chama friend, church/mosque peer) who can hold 20 minutes of safe play or run one errand this week.',
      'Module 4 — Warm Clinical Escalation for Persistent Distress: If sadness, hopelessness, or inability to cope persists for days, warmly connect the caregiver to a Kenyan child/family psychologist or maternal mental health clinician.'
    ],
    caregiverGuidance: 'You do not have to carry everything alone. Up to 1 in 3 caregivers walking this journey experience heavy stress or low mood—asking for support is strength, not failure.',
    sensoryTips: 'Notice early physical stress signals (tight jaw, headaches, snapping easily, feeling numb) as cues to pause developmental exercises and focus purely on rest.',
    therapistRationale: 'UNICEF CFC demonstrates that strengthening caregiver psychosocial wellbeing directly improves child developmental outcomes, attachment security, and sustained engagement.',
    keywords: ['unicef', 'cfc', 'caring for the caregiver', 'stress', 'depression', 'sad', 'crying', 'burnout', 'lonely', 'overwhelmed', 'mental health', 'exhausted', 'resilience', 'hopeless', 'wasiwasi']
  },
  {
    id: 'mat_unicef_cfc_family_support',
    title: 'UNICEF CFC: Shared Family Care & Reducing Caregiver Isolation',
    domain: 'caregiver_wellness',
    sourceFramework: 'UNICEF Caring for the Caregiver (CFC)',
    referralStandard: 'UNICEF CFC Engaging Partners, Fathers & Extended Household',
    ageRange: 'Parents, Fathers & Extended Family',
    description: 'Practical UNICEF Caring for the Caregiver module designed to involve fathers, siblings, grandparents, and household helpers so care responsibilities are shared rather than resting solely on one exhausted mother.',
    activities: [
      '5-Minute "Baba / Auntie" Play Job: Give another household member one simple, enjoyable role (e.g., making animal sounds or holding a cup during bath time) so Mama gets 15 uninterrupted minutes.',
      'Simple Explaining Script for Relatives: Equip the caregiver with warm words to explain sensory triggers (like loud noises or red tiles) to visiting relatives without shame.',
      'Celebrate Small Caregiver Wins: Ask the parent to name ONE kind thing they did for themselves or their child today.'
    ],
    caregiverGuidance: 'Sharing even one small daily task with a partner, older sibling, or relative protects your energy and helps your child bond with more loving adults.',
    therapistRationale: 'Reducing maternal isolation via shared household caregiving lowers chronic parenting stress and sustains long-term developmental routines.',
    keywords: ['unicef', 'cfc', 'family', 'father', 'husband', 'relatives', 'alone', 'isolated', 'support circle', 'shared care', 'mama']
  }
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'have', 'has', 'had',
  'not', 'but', 'can', 'you', 'your', 'our', 'her', 'his', 'she', 'him', 'they', 'them',
  'what', 'when', 'how', 'why', 'who', 'today', 'very', 'just', 'like', 'about', 'into'
]);

export function searchRAGMaterials(query: string, _childAgeMonths?: number): EducationalMaterial[] {
  const lowerQuery = query.toLowerCase();
  const tokens = Array.from(
    new Set(
      lowerQuery
        .split(/[^a-z0-9]+/)
        .map(t => t.trim())
        .filter(t => t.length >= 3 && !STOP_WORDS.has(t))
    )
  );

  const scored = VERIFIED_EDUCATIONAL_MATERIALS.map(material => {
    let score = 0;
    const titleLower = material.title.toLowerCase();
    const descLower = material.description.toLowerCase();
    const frameworkLower = (material.sourceFramework || '').toLowerCase();

    for (const kw of material.keywords) {
      const kwLower = kw.toLowerCase();
      if (lowerQuery.includes(kwLower)) score += 4;
    }

    for (const token of tokens) {
      if (material.keywords.some(kw => kw.toLowerCase().includes(token))) score += 2;
      if (titleLower.includes(token)) score += 2;
      if (frameworkLower.includes(token)) score += 3;
      if (descLower.includes(token)) score += 1;
    }

    if (lowerQuery.includes(material.domain.replace('_', ' '))) score += 3;
    if (lowerQuery.includes(titleLower)) score += 5;

    return { material, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .map(item => item.material);
}
