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
    ageRange: '3 - 6 Years',
    description: 'Evidence-based pediatric occupational therapy protocol for children who display aversion or avoidance of high-stimulus visual colors (such as bright red tiles or objects). Uses gradual pairing and play-based exposure without forcing.',
    activities: [
      'Stage 1: Neutral Pairing - Keep the red tile 30cm away on a neutral placemat while child plays with favored green or blue tiles.',
      'Stage 2: Peekaboo Reveal - Hide the red tile beneath a neutral cloth and let the child lift the cloth on their own terms.',
      'Stage 3: Tool Touch - Use a favorite plastic spoon, wooden stick, or toy car to touch or push the red tile without direct fingertip contact.',
      'Stage 4: Co-sorting with caregiver - Caregiver places red tile into the bin first while singing a calming rhythm, inviting child to celebrate with a high-five.',
    ],
    caregiverGuidance: 'Never force the child to touch or hold an aversive stimulus. If the child pushes them away or un-sorts them (as Joash did with "alizipangua"), validate with humor: "Red is taking a little nap today!" Praise every calm breath.',
    sensoryTips: 'High contrast colors stimulate the sympathetic nervous system more intensely. Gradual desensitization takes 2 to 4 weeks of gentle, positive micro-moments.',
    therapistRationale: 'Red wavelengths have the longest visible wavelength and can cause sensory overwhelm in neurodiverse or sensitive nervous systems. Gradual exposure builds neural habituation safely.',
    keywords: ['red', 'color puzzle', 'tiles', 'sensory aversion', 'restless', 'alizipangua', 'tolerance', 'occupational therapy']
  },
  {
    id: 'mat_independent_puzzle_mastery',
    title: 'Milestone Consolidation: Independent Puzzle Solving & Spatial Reasoning',
    domain: 'motor',
    ageRange: '3 - 7 Years',
    description: 'Guidelines for celebrating and stretching independent play when a child (like Bravin) masters solving puzzles or construction kits completely alone.',
    activities: [
      'Rotate & Fit Challenge: Flip one puzzle piece upside down or turn the board 90 degrees to foster mental spatial rotation.',
      'Mystery Piece Delivery: Hide 2 pieces around the living room and turn puzzle completion into a mini treasure hunt.',
      'Storyteller Puzzle: Ask child: "What sound does this lion piece make when it finds its home on the board?"',
      'Peer or Sibling Co-play: Invite child to be the "Puzzle Teacher" guiding another child or teddy bear.'
    ],
    caregiverGuidance: 'When a child does a puzzle kit completely alone, provide descriptive praise rather than generic "good job". Say: "You looked closely at the edges and tried three times until it fit! You worked through that puzzle all by yourself."',
    sensoryTips: 'Tactile resistance of wooden or thick cardboard puzzle pieces provides calming proprioceptive feedback to fingers and joints.',
    therapistRationale: 'Independent completion of 12-24 piece puzzles demonstrates working memory, bilateral coordination, and executive functioning sustained attention.',
    keywords: ['puzzle', 'alone', 'independent', 'bravin', 'kit', 'spatial', 'motor']
  },
  {
    id: 'mat_speech_expressive_song',
    title: 'Language Acceleration: Singing with Complete Words & Melodic Prosody',
    domain: 'singing',
    ageRange: '2 - 5 Years',
    description: 'Protocol to expand expressive vocabulary and speech clarity when a child (like Sharon) transitions from syllables to singing complete words.',
    activities: [
      'Call & Response Song: Caregiver sings the first phrase ("Twinkle, twinkle little..."), pauses with wide eyes, and waits 3 seconds for the child to sing the next word ("...star!").',
      'Swahili & English Rhythm Clapping: Sing "Mimi na wewe, rafiki wa kweli" while clapping hands together, tapping knees, or shaking a shaker.',
      'Action Mirroring: Sing "Head, Shoulders, Knees and Toes" or "Tembo mkubwa mwenye masikio makubwa" while acting out the animal gestures.',
      'Microphone Pretend Play: Use a rolled-up cardboard tube or wooden spoon as a microphone to boost vocal confidence.'
    ],
    caregiverGuidance: 'Notice words articulated clearly during song. Melodic intonation therapy leverages the right hemisphere of the brain to unlock speech pathways that spoken language alone might find difficult.',
    sensoryTips: 'Rhythm and music stimulate auditory cortex synchronization and soothe speech hesitation.',
    therapistRationale: 'Transition from single syllables to multi-word phrasing in song marks emergence of expressive syntax and phonemic memory consolidation.',
    keywords: ['singing', 'words', 'speech', 'sharon', 'talking', 'language', 'song', 'nursery rhymes']
  },
  {
    id: 'mat_reading_kenyan_storytelling',
    title: 'Contextual Storytelling & Interactive Picture Reading (Hadithi Hadithi)',
    domain: 'reading',
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
    keywords: ['spelling', 'letters', 'phonics', 'writing', 'sand', 'playdough', 'tracing']
  },
  {
    id: 'mat_drawing_emotional_expression',
    title: 'Expressive Drawing & Fine Motor Joy: Crayons, Water & Finger Colors',
    domain: 'drawing',
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
    keywords: ['drawing', 'painting', 'crayons', 'art', 'motor', 'grip', 'leaves']
  },
  {
    id: 'mat_caregiver_rest_regulation',
    title: 'Caregiver Nervous System Reset: The 2-Minute Breathing & Rest Mode',
    domain: 'sensory_play',
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
    keywords: ['exhausted', 'tired', 'overwhelmed', 'hard day', 'burnout', 'break', 'rest']
  }
];

export function searchRAGMaterials(query: string, childAgeMonths?: number): EducationalMaterial[] {
  const lowerQuery = query.toLowerCase();
  const scored = VERIFIED_EDUCATIONAL_MATERIALS.map(material => {
    let score = 0;
    for (const kw of material.keywords) {
      if (lowerQuery.includes(kw)) score += 3;
    }
    if (lowerQuery.includes(material.domain)) score += 2;
    if (lowerQuery.includes(material.title.toLowerCase())) score += 4;
    return { material, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .map(item => item.material);
}
