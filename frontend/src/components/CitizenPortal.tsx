import React, { useState, useRef } from 'react';
import { Camera, MapPin, Mic, Send, AlertTriangle, X, ExternalLink, Loader2, Check, Image as ImageIcon, Phone, Mail } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { saveOfflineIncident, type OfflineIncident } from '../utils/offlineStore';

export default function CitizenPortal() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  
  // Citizen Contact state
  const [reporterPhone, setReporterPhone] = useState('');
  
  const [citizenEmailStatus, setCitizenEmailStatus] = useState<'sent' | 'failed' | 'pending' | null>(null);
  const [commandCenterEmailStatus, setCommandCenterEmailStatus] = useState<'sent' | 'pending' | 'failed' | 'retrying' | null>(null);
  const [lastIncidentId, setLastIncidentId] = useState<string | null>(null);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Photo states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location states
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { email } = useAuthStore();
  const [reportType, setReportType] = useState('Road Accident');
  const [description, setDescription] = useState('');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const getSupportedMimeType = (): string => {
    const candidateTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    for (const t of candidateTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // Start real microphone voice recording with dynamic browser format detection
  const startRecording = async () => {
    setAudioError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAudioError("Voice recording is not supported in your browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      const actualMime = mediaRecorder.mimeType || mimeType || 'audio/webm';

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: actualMime });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Stop microphone stream tracks cleanly
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setAudioError("Microphone permission denied by user.");
      } else {
        setAudioError("Failed to access microphone.");
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleDeleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioError(null);
    setRecordingDuration(0);
  };

  // Handle Photo selection & validation
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Only image files (JPG, PNG, WebP, etc.) are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('File size exceeds the 10 MB limit.');
      return;
    }

    setPhotoError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Geolocation capture
  const handleLocation = () => {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setIsGettingLocation(false);
      },
      (err) => {
        setIsGettingLocation(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError("Location permission denied by user.");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("Failed to capture location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const severityMap: Record<string, string> = {
      'Road Accident': 'CRITICAL',
      'Fire': 'HIGH',
      'Flood': 'HIGH',
      'Medical Emergency': 'HIGH',
      'Complaint / General Issue': 'LOW',
      'Other': 'MEDIUM'
    };

    const nowIso = new Date().toISOString();

    if (!navigator.onLine) {
      console.warn("User is offline. Saving report locally to IndexedDB.");
      const offlineItem: OfflineIncident = {
        id: `INC-OFFLINE-${Date.now().toString().slice(-6)}`,
        type: reportType,
        severity: severityMap[reportType] || 'MEDIUM',
        status: 'REPORTED',
        description,
        lat: coords ? coords.lat : 40.7128,
        lng: coords ? coords.lng : -74.0060,
        reporter_email: email || undefined,
        reporter_phone: reporterPhone || undefined,
        photo_blob: photoFile,
        photo_name: photoFile?.name,
        audio_blob: audioBlob,
        audio_name: 'voice-recording.webm',
        created_at: nowIso,
        time: nowIso,
        sync_status: 'pending'
      };
      await saveOfflineIncident(offlineItem);
      setIsOfflineSaved(true);
      setCommandCenterEmailStatus('pending');
      setIsSubmitting(false);
      setSubmitted(true);
      return;
    }

    const formData = new FormData();
    formData.append('type', reportType);
    formData.append('severity', severityMap[reportType] || 'MEDIUM');
    formData.append('status', 'REPORTED');
    formData.append('description', description);
    formData.append('created_at', nowIso);
    if (email) formData.append('reporter_email', email);
    if (reporterPhone) formData.append('reporter_phone', reporterPhone);
    
    if (coords) {
      formData.append('lat', coords.lat.toString());
      formData.append('lng', coords.lng.toString());
    }
    
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    if (audioBlob) {
      formData.append('audio', audioBlob, 'voice-recording.webm');
    }

    try {
      const res = await fetch('http://localhost:8000/incidents', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      const serverIncident = data.incident;
      if (serverIncident?.id) {
        setLastIncidentId(serverIncident.id);
      }

      if (data.command_center_email_sent || serverIncident?.email_sent) {
        setCommandCenterEmailStatus('sent');
      } else {
        setCommandCenterEmailStatus('failed');
      }

      if (email && serverIncident?.id) {
        try {
          const emailRes = await fetch(`http://localhost:8000/incidents/${serverIncident.id}/send-citizen-email`, {
            method: 'POST'
          });
          if (emailRes.ok) {
            setCitizenEmailStatus('sent');
          } else {
            setCitizenEmailStatus('failed');
          }
        } catch (e) {
          setCitizenEmailStatus('failed');
        }
      }

      setIsOfflineSaved(false);
      setIsSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      console.warn("Network request failed, saving incident locally to IndexedDB:", err);
      const offlineItem: OfflineIncident = {
        id: `INC-OFFLINE-${Date.now().toString().slice(-6)}`,
        type: reportType,
        severity: severityMap[reportType] || 'MEDIUM',
        status: 'REPORTED',
        description,
        lat: coords ? coords.lat : 40.7128,
        lng: coords ? coords.lng : -74.0060,
        reporter_email: email || undefined,
        reporter_phone: reporterPhone || undefined,
        photo_blob: photoFile,
        photo_name: photoFile?.name,
        audio_blob: audioBlob,
        audio_name: 'voice-recording.webm',
        created_at: nowIso,
        time: nowIso,
        sync_status: 'pending'
      };
      await saveOfflineIncident(offlineItem);
      setCommandCenterEmailStatus('pending');
      setIsOfflineSaved(true);
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleRetryCommandCenterEmail = async () => {
    if (!lastIncidentId) return;
    setCommandCenterEmailStatus('retrying');
    try {
      const res = await fetch(`http://localhost:8000/incidents/${lastIncidentId}/send-email`, {
        method: 'POST'
      });
      if (res.ok) {
        setCommandCenterEmailStatus('sent');
      } else {
        setCommandCenterEmailStatus('failed');
      }
    } catch (e) {
      setCommandCenterEmailStatus('failed');
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setIsOfflineSaved(false);
    setCitizenEmailStatus(null);
    setCommandCenterEmailStatus(null);
    setLastIncidentId(null);
    setDescription('');
    handleRemovePhoto();
    handleDeleteAudio();
    setCoords(null);
    setLocationError(null);
  };

  if (submitted) {
    return (
      <div className={`max-w-xl mx-auto mt-12 bg-slate-900 border ${isOfflineSaved ? 'border-amber-500/40' : 'border-green-500/30'} rounded-2xl p-8 text-center shadow-2xl`}>
        <div className={`w-16 h-16 ${isOfflineSaved ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {isOfflineSaved ? <Check className="w-8 h-8 text-amber-400" /> : <Send className="w-8 h-8" />}
        </div>
        <h2 className={`text-2xl font-bold ${isOfflineSaved ? 'text-amber-300' : 'text-slate-100'} mb-2`}>
          {isOfflineSaved ? '✓ Emergency Report Saved Offline' : 'Report Received'}
        </h2>
        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
          {isOfflineSaved
            ? 'Your report will be automatically sent to the Command Centre when network coverage returns.'
            : 'Your emergency report has been sent to the ResQAI Command Center. AI analysis is currently processing the details.'}
        </p>

        {/* Command Centre Email Delivery Badge */}
        <div className="mb-4 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs flex flex-col gap-1 items-center justify-center">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">Command Centre Email (shreyasbpalan5@gmail.com):</span>
          </div>
          {commandCenterEmailStatus === 'sent' && (
            <span className="font-bold text-green-400 flex items-center gap-1">✓ Email Sent</span>
          )}
          {commandCenterEmailStatus === 'pending' && (
            <span className="font-bold text-amber-400 flex items-center gap-1">⚠ Email Pending (Will send on network recovery)</span>
          )}
          {commandCenterEmailStatus === 'retrying' && (
            <span className="font-bold text-blue-400 flex items-center gap-1">⏳ Sending Email...</span>
          )}
          {commandCenterEmailStatus === 'failed' && (
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-red-400">✕ Email Failed</span>
              {lastIncidentId && (
                <button
                  onClick={handleRetryCommandCenterEmail}
                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded text-[11px] font-bold transition-all"
                >
                  Retry Email
                </button>
              )}
            </div>
          )}
        </div>

        {citizenEmailStatus === 'sent' && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs font-semibold text-green-400 flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>Citizen confirmation email sent to {email}</span>
          </div>
        )}

        {citizenEmailStatus === 'failed' && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-semibold text-amber-400 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Citizen email delivery failed (will retry automatically)</span>
          </div>
        )}

        {citizenEmailStatus === 'failed' && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-semibold text-amber-400 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Email delivery failed (will retry automatically)</span>
          </div>
        )}
        <button 
          onClick={resetForm}
          className={`px-6 py-3 bg-slate-800 hover:bg-slate-700 ${isOfflineSaved ? 'text-amber-300 border border-amber-500/30' : 'text-slate-200'} rounded-lg font-bold text-sm transition-colors`}
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl font-bold tracking-wider">Report Emergency</h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => window.history.back()} className="text-sm text-slate-400 hover:text-white font-medium transition-colors">
            Cancel & Go Back
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="h-full flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-bold">New Incident Report</h2>
                <p className="text-slate-400 text-sm">Fill in the details below. Our AI will analyze and prioritize.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Hidden Native File Input */}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,image/jpg,image/*"
                className="hidden"
              />

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Report Type</label>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option>Road Accident</option>
                  <option>Fire</option>
                  <option>Flood</option>
                  <option>Medical Emergency</option>
                  <option>Complaint / General Issue</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Citizen Mobile Contact Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                  <input 
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-11 pr-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what happened..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button 
                  type="button" 
                  onClick={handlePhotoClick}
                  className={`flex flex-col items-center justify-center gap-2 py-4 border rounded-lg transition-all ${photoFile ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-slate-950 border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 text-slate-400 hover:text-blue-400'}`}
                >
                  {photoFile ? <Check className="w-6 h-6 text-green-400" /> : <Camera className="w-6 h-6" />}
                  <span className="text-xs font-medium">{photoFile ? 'Photo Added' : 'Add Photo'}</span>
                </button>
                
                <button 
                  type="button" 
                  onClick={handleToggleRecording}
                  className={`flex flex-col items-center justify-center gap-2 py-4 border rounded-lg transition-all ${isRecording ? 'bg-red-500/20 border-red-500 animate-pulse text-red-500' : audioBlob ? 'bg-green-500/10 border-green-500/50 text-green-400' : audioError ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-slate-950 border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 text-slate-400 hover:text-blue-400'}`}
                >
                  {isRecording ? (
                    <Mic className="w-6 h-6 animate-ping text-red-500" />
                  ) : audioBlob ? (
                    <Check className="w-6 h-6 text-green-400" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                  <span className="text-xs font-medium">
                    {isRecording ? `🔴 Recording... (${formatDuration(recordingDuration)})` : audioBlob ? 'Audio Recorded' : 'Record Audio'}
                  </span>
                </button>
                
                <button 
                  type="button" 
                  onClick={handleLocation}
                  disabled={isGettingLocation}
                  className={`flex flex-col items-center justify-center gap-2 py-4 border rounded-lg transition-all ${isGettingLocation ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 cursor-wait' : coords ? 'bg-green-500/10 border-green-500/50 text-green-400' : locationError ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-slate-950 border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 text-slate-400 hover:text-blue-400'}`}
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  ) : coords ? (
                    <Check className="w-6 h-6 text-green-400" />
                  ) : (
                    <MapPin className="w-6 h-6" />
                  )}
                  <span className="text-xs font-medium">
                    {isGettingLocation ? 'Getting location…' : coords ? 'Location Added' : 'Get Location'}
                  </span>
                </button>
              </div>

              {/* Photo Error Banner */}
              {photoError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center justify-between">
                  <span>{photoError}</span>
                  <button type="button" onClick={() => setPhotoError(null)} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Photo Preview Panel */}
              {photoPreview && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img 
                      src={photoPreview} 
                      alt="Selected attachment preview" 
                      className="w-14 h-14 object-cover rounded-md border border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200 truncate">
                        <ImageIcon className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="truncate">{photoFile?.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handlePhotoClick}
                      className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded font-medium transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Audio Error Banner */}
              {audioError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center justify-between">
                  <span>{audioError}</span>
                  <button type="button" onClick={() => setAudioError(null)} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Audio Preview Panel */}
              {audioUrl && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-400">
                      <Mic className="w-4 h-4 text-green-400" />
                      <span>🎙 Audio Recorded ({formatDuration(recordingDuration)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAudio}
                      className="text-xs px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded font-medium transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Delete / Re-record
                    </button>
                  </div>
                  <audio controls src={audioUrl} className="w-full h-9 rounded" />
                </div>
              )}

              {/* Location Error Banner */}
              {locationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center justify-between">
                  <span>{locationError}</span>
                  <button type="button" onClick={() => setLocationError(null)} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Captured Location Info Card */}
              {coords && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-green-400">📍 Location Captured</div>
                      <div className="text-xs font-mono text-slate-300 mt-0.5">
                        Latitude: {coords.lat.toFixed(4)} | Longitude: {coords.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium underline flex-shrink-0 ml-2"
                  >
                    <span>Open Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all
                  ${isSubmitting ? 'bg-red-600/50 text-red-200 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing via AI...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Emergency Report
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

