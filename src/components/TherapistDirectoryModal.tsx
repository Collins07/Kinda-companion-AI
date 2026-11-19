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
  Video,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { Therapist, TherapistAppointment, ChildProfile } from '../types';
import { VERIFIED_THERAPISTS } from '../server/therapistDirectory';

interface TherapistDirectoryModalProps {
  child: ChildProfile;
  appointments: TherapistAppointment[];
  onBookAppointment: (appt: Partial<TherapistAppointment>) => Promise<void>;
  onConfirmAppointment: (appointmentId: string, confirmedDate: string, confirmedTime: string) => Promise<void>;
  onClose: () => void;
}

export const TherapistDirectoryModal: React.FC<TherapistDirectoryModalProps> = ({
  child,
  appointments,
  onBookAppointment,
  onConfirmAppointment,
  onClose
}) => {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [bookingTherapist, setBookingTherapist] = useState<Therapist | null>(null);
  const [sessionTopic, setSessionTopic] = useState(`Caregiver Consultation for ${child.name}`);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline specialist/admin slot selection when confirming an awaiting request
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [chosenDate, setChosenDate] = useState('');
  const [chosenTime, setChosenTime] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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

  const handleRequestBooking = async (e: React.FormEvent) => {
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
      date: preferredDate.trim() || 'To be chosen by therapist',
      time: preferredTime.trim() || 'To be chosen by therapist',
      mode: 'virtual_zoom',
      sessionTopic,
      status: 'requested_awaiting_confirmation',
      statusLabel: 'Requested, awaiting therapist confirmation',
      notes: 'Requested via Kinda Care; specialist to choose available date & time.'
    });
    setIsSubmitting(false);
    setPreferredDate('');
    setPreferredTime('');
    setBookingTherapist(null);
  };

  const openScheduleEditor = (appt: TherapistAppointment) => {
    setSchedulingId(appt.id);
    setConfirmError(null);
    setChosenDate(/to be chosen/i.test(appt.date) ? '' : appt.date);
    setChosenTime(/to be chosen/i.test(appt.time) ? '' : appt.time);
  };

  const handleConfirmChosenSlot = async (appointmentId: string) => {
    if (!chosenDate.trim() || !chosenTime.trim()) {
      setConfirmError('Please choose both a calendar date and time before confirming.');
      return;
    }
    setConfirmError(null);
    setConfirmingId(appointmentId);
    await onConfirmAppointment(appointmentId, chosenDate.trim(), chosenTime.trim());
    setConfirmingId(null);
    setSchedulingId(null);
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
                Kenyan Pediatric Specialist Directory &amp; Booking Requests
              </h2>
              <p className="text-xs text-slate-500">
                Single request per specialist • The therapist chooses their available date &amp; time before confirming
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

        {/* Appointment Requests Ribbon */}
        {appointments.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-950/40 px-6 py-3 border-b border-purple-200 dark:border-purple-900">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block mb-1.5">
              Appointments on file for {child.name}:
            </span>
            <div className="space-y-2">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Video className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{appt.therapistName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {appt.date} • {appt.time}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-purple-700 dark:text-purple-400 font-medium">{appt.sessionTopic}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold ${
                        appt.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {appt.statusLabel || (appt.status === 'confirmed' ? 'Confirmed' : 'Requested, awaiting therapist confirmation')}
                      </span>

                      {appt.status === 'requested_awaiting_confirmation' && schedulingId !== appt.id && (
                        <button
                          type="button"
                          onClick={() => openScheduleEditor(appt)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10.5px] font-semibold flex items-center space-x-1 transition"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Choose Time &amp; Confirm</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {schedulingId === appt.id && (
                    <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-2">
                      <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 block">
                        Specialist / Admin: Choose your available date &amp; time for {child.caregiverName}
                      </span>
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="date"
                          value={chosenDate}
                          onChange={(e) => setChosenDate(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-100"
                        />
                        <input
                          type="time"
                          value={chosenTime}
                          onChange={(e) => setChosenTime(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          disabled={confirmingId === appt.id}
                          onClick={() => handleConfirmChosenSlot(appt.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-[11px] font-semibold transition"
                        >
                          {confirmingId === appt.id ? 'Confirming...' : 'Confirm Chosen Time & Notify Parent'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSchedulingId(null)}
                          className="text-slate-500 hover:text-slate-700 px-2 py-1 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                      {confirmError && (
                        <p className="text-[11px] text-red-600 font-medium">{confirmError}</p>
                      )}
                    </div>
                  )}
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
          {filteredTherapists.map((therapist) => {
            const hasPendingForTherapist = appointments.some(
              a => a.therapistId === therapist.id && a.status === 'requested_awaiting_confirmation'
            );
            return (
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
                  disabled={hasPendingForTherapist}
                  onClick={() => setBookingTherapist(therapist)}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:text-slate-600 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {hasPendingForTherapist
                      ? 'Request Already Sent — Awaiting Therapist Time'
                      : 'Send Single Consultation Request'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Booking Request Modal Overlay */}
        {bookingTherapist && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <form
              onSubmit={handleRequestBooking}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Request Consultation with {bookingTherapist.name}
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
                  <label className="text-slate-500 block mb-1">Consultation Focus</label>
                  <input
                    type="text"
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-1">Optional Date Preference</label>
                    <input
                      type="text"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      placeholder="Leave blank for therapist to choose"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Optional Time Preference</label>
                    <input
                      type="text"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      placeholder="Leave blank for therapist to choose"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 text-amber-900 dark:text-amber-300 text-[11px]">
                  Only one request will be sent to {bookingTherapist.name}. They will choose an available date &amp; time before confirming to {child.caregiverName}.
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
                  {isSubmitting ? 'Submitting...' : 'Submit Single Request'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
