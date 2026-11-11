/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserCheck,
  X,
  Search,
  MapPin,
  Calendar,
  Clock,
  Video,
  ShieldCheck,
  CheckCircle,
  PhoneCall,
  Plus
} from 'lucide-react';
import { Therapist, TherapistAppointment, ChildProfile } from '../types';
import { VERIFIED_THERAPISTS } from '../server/therapistDirectory';

interface TherapistDirectoryModalProps {
  child: ChildProfile;
  appointments: TherapistAppointment[];
  onBookAppointment: (appt: Partial<TherapistAppointment>) => Promise<void>;
  onClose: () => void;
}

export const TherapistDirectoryModal: React.FC<TherapistDirectoryModalProps> = ({
  child,
  appointments,
  onBookAppointment,
  onClose
}) => {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [bookingTherapist, setBookingTherapist] = useState<Therapist | null>(null);
  const [sessionTopic, setSessionTopic] = useState(`Sensory & Developmental Support for ${child.name}`);
  const [preferredDate, setPreferredDate] = useState('Upcoming Saturday');
  const [preferredTime, setPreferredTime] = useState('10:00 AM (EAT)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTherapists = VERIFIED_THERAPISTS.filter(t => {
    let match = true;
    if (searchLocation.trim()) {
      match = match && t.location.toLowerCase().includes(searchLocation.toLowerCase());
    }
    if (selectedSpecialty) {
      match = match && t.specialty === selectedSpecialty;
    }
    return match;
  });

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTherapist || isSubmitting) return;
    setIsSubmitting(true);
    await onBookAppointment({
      childId: child.id,
      childName: child.name,
      caregiverName: child.caregiverName,
      caregiverPhone: child.caregiverPhone,
      therapistId: bookingTherapist.id,
      therapistName: bookingTherapist.name,
      date: preferredDate,
      time: preferredTime,
      mode: 'virtual_zoom',
      sessionTopic,
      status: 'scheduled',
      notes: `Booked via Kinda Care WhatsApp companion bridge.`
    });
    setIsSubmitting(false);
    setBookingTherapist(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Kenyan Pediatric Specialist Directory & Escalation Bridge
              </h2>
              <p className="text-xs text-slate-500">
                Vetted Occupational Therapists, Speech Pathologists, and Child Psychologists (Kiambu, Nairobi & Virtual)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scheduled Appointments Ribbon */}
        {appointments.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-950/40 px-6 py-3 border-b border-purple-200 dark:border-purple-900">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block mb-1">
              Active Scheduled Sessions for {child.name}:
            </span>
            <div className="space-y-1.5">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{appt.therapistName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 dark:text-slate-300">{appt.date} at {appt.time}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-purple-700 dark:text-purple-400 font-medium">{appt.sessionTopic}</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {appt.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Search location (e.g. Kiambu, Nairobi, Thika)..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="">All Specialties</option>
            <option value="Occupational Therapy (Sensory)">Occupational Therapy (Sensory)</option>
            <option value="Speech & Language Pathology">Speech & Language Pathology</option>
            <option value="Child & Adolescent Psychology">Child & Adolescent Psychology</option>
            <option value="Pediatric Physiotherapy">Pediatric Physiotherapy</option>
          </select>
        </div>

        {/* Therapist Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTherapists.map((therapist) => (
            <div
              key={therapist.id}
              className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span>{therapist.name}</span>
                      <span title="Verified License"><ShieldCheck className="w-4 h-4 text-emerald-600" /></span>
                    </h3>
                    <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                      {therapist.title}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200">
                    KSh {therapist.rateKSh.toLocaleString()}/session
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{therapist.location}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {therapist.bio}
                </p>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p><strong className="text-slate-700 dark:text-slate-300">Credentials:</strong> {therapist.credentials}</p>
                  <p><strong className="text-slate-700 dark:text-slate-300">Languages:</strong> {therapist.languages.join(', ')}</p>
                  <p><strong className="text-slate-700 dark:text-slate-300">Available:</strong> {therapist.availableDays.join(', ')}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBookingTherapist(therapist)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule 30-Min Virtual Session</span>
              </button>
            </div>
          ))}
        </div>

        {/* Booking Modal Overlay */}
        {bookingTherapist && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <form
              onSubmit={handleConfirmBooking}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Schedule Virtual Session with {bookingTherapist.name}
                  </h4>
                  <p className="text-xs text-purple-600">{bookingTherapist.specialty}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingTherapist(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">Session Topic / Reason</label>
                  <input
                    type="text"
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-1">Date</label>
                    <input
                      type="text"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Time</label>
                    <input
                      type="text"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-[11px]">
                  ✓ Confirmed for {child.caregiverName} ({child.caregiverPhone}). Session link will be sent automatically via WhatsApp.
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingTherapist(null)}
                  className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Session'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
