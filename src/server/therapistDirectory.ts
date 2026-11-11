/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Therapist } from '../types';

export const VERIFIED_THERAPISTS: Therapist[] = [
  {
    id: 'therapist_dr_wanjiku',
    name: 'Dr. Wanjiku Mwangi, OTR/L',
    title: 'Lead Pediatric Occupational Therapist',
    specialty: 'Occupational Therapy (Sensory)',
    location: 'Kiambu / Thika Road & Virtual (Zoom/WhatsApp)',
    languages: ['English', 'Swahili', 'Kikuyu'],
    onlineOrInPerson: 'Both',
    rateKSh: 2500,
    experienceYears: 11,
    credentials: 'MSc Paediatric OT (KU), Reg. KOTPA #241, Sensory Integration Certified',
    bio: 'Specialist in sensory modulation, visual-spatial processing, color defensiveness, fine motor skill emergence, and neurodiversity-affirming home play strategies.',
    availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    avatar: 'https://images.unsplash.com/photo-1594824813566-7875a3594026?auto=format&fit=crop&w=256&q=80'
  },
  {
    id: 'therapist_brian_otieno',
    name: 'Brian Otieno, MSc. SLP',
    title: 'Senior Speech & Language Pathologist',
    specialty: 'Speech & Language Pathology',
    location: 'Nairobi - Kilimani & Westlands (In-Person & Telepractice)',
    languages: ['English', 'Swahili', 'Luo'],
    onlineOrInPerson: 'Both',
    rateKSh: 3000,
    experienceYears: 9,
    credentials: 'BSc SLT (Moi University), MSc Speech Pathology (Univ. of Cape Town), Reg. ASLPK',
    bio: 'Focuses on expressive language delays, melodic intonation, bilingual language acquisition (English/Swahili), speech sound disorders, and conversational turn-taking.',
    availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80'
  },
  {
    id: 'therapist_faith_chebet',
    name: 'Faith Chebet, MPsych',
    title: 'Child & Family Clinical Psychologist',
    specialty: 'Child & Adolescent Psychology',
    location: 'Nairobi - Ngong Road & Kiambu County Outpatient',
    languages: ['English', 'Swahili', 'Kalenjin'],
    onlineOrInPerson: 'Both',
    rateKSh: 3500,
    experienceYears: 8,
    credentials: 'MA Clinical Child Psychology (USIU), Reg. KPA #819',
    bio: 'Assists parents with caregiver burnout, emotional co-regulation, emotional dysregulation, anxiety, gentle boundary-setting, and early behavioral support.',
    availableDays: ['Monday', 'Tuesday', 'Thursday'],
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'
  },
  {
    id: 'therapist_samuel_kamau',
    name: 'Samuel Kamau, PT',
    title: 'Pediatric Physical Therapist',
    specialty: 'Pediatric Physiotherapy',
    location: 'Kiambu Town & Ruiru Outreaches',
    languages: ['English', 'Swahili', 'Kikuyu'],
    onlineOrInPerson: 'In-Person Only',
    rateKSh: 2200,
    experienceYears: 12,
    credentials: 'BSc Physiotherapy (KMTC), Pediatric Specialization Certified',
    bio: 'Gross motor coordination, balance, core stability, toe-walking evaluation, and milestone progression for infants and young children.',
    availableDays: ['Wednesday', 'Saturday'],
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=256&q=80'
  }
];

export function findTherapists(criteria: { location?: string; specialty?: string; language?: string }): Therapist[] {
  return VERIFIED_THERAPISTS.filter(t => {
    let match = true;
    if (criteria.location) {
      const loc = criteria.location.toLowerCase();
      match = match && (t.location.toLowerCase().includes(loc) || loc.includes('kiambu') && t.location.toLowerCase().includes('kiambu'));
    }
    if (criteria.specialty) {
      match = match && t.specialty.toLowerCase().includes(criteria.specialty.toLowerCase());
    }
    if (criteria.language) {
      match = match && t.languages.some(l => l.toLowerCase().includes(criteria.language!.toLowerCase()));
    }
    return match;
  });
}
