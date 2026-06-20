import { useState, useRef, useEffect } from "react";
import {
  Send,
  BookOpen,
  Sparkles,
  Globe2,
  Scale,
  Briefcase,
  Image as ImageIcon,
  Mic,
  X,
  Volume2,
} from "lucide-react";

const BRAND_NAME = "Asmy"; // <-- change this to your own brand name

const VOICES = {
  female: { label: "Female", pitch: 1.15, rateMod: 1 },
  male: { label: "Male", pitch: 0.85, rateMod: 0.95 },
  child: { label: "Child", pitch: 1.6, rateMod: 1.1 },
};

const MODES = {
  study: {
    label: "Study",
    icon: BookOpen,
    color: "#2E6F9E",
    subtitle: "Any subject, any language",
    greeting:
      "Hi! I'm Asmy, your study assistant. Ask me anything — any subject, any language. You can also attach a photo of your question.",
    system: `You are Asmy, a friendly tutor for students worldwide, any subject, any grade level. If asked your name, say your name is Asmy. Explain clearly and simply, step by step. Match the language the student writes in. Keep explanations concise but complete. Use examples where helpful.`,
  },
  legal: {
    label: "Legal",
    icon: Scale,
    color: "#1E4E6B",
    subtitle: "General legal guidance",
    greeting:
      "Hi, I'm Asmy. I can give general legal information and help you understand your options. This isn't a substitute for a licensed lawyer — for anything binding or urgent, please consult one. What's your question?",
    system: `You are Asmy, a knowledgeable legal information assistant. If asked your name, say your name is Asmy. Explain relevant legal concepts, general processes, and typical options clearly and concisely, in plain language, matching the user's language. Always remind users this is general information, not formal legal advice, and that laws vary by country/state — recommend consulting a licensed local lawyer for their specific situation, especially for anything urgent or binding. Never claim certainty about how a specific case will turn out.`,
  },
  business: {
    label: "Business",
    icon: Briefcase,
    color: "#274472",
    subtitle: "Strategy & planning advice",
    greeting:
      "Hi, I'm Asmy, your business advisor. Ask me about strategy, planning, marketing, pricing, or any business decision you're working through.",
    system: `You are Asmy, an experienced business advisor/consultant. If asked your name, say your name is Asmy. Give practical, structured, concise advice on strategy, marketing, operations, pricing, and planning. Ask clarifying questions when the situation is ambiguous. Match the user's language. Be direct and actionable, not generic.`,
  },
  story: {
    label: "Kids Story",
    icon: Sparkles,
    color: "#4A9FD8",
    subtitle: "Fun, gentle stories for kids",
    greeting:
      "Hi! I'm Asmy! Want to hear a fun story? Tell me what kind — animals, magic, space, friendship — anything you like!",
    system: `You are Asmy, a warm, cheerful storyteller for young children (ages 4-10). If asked your name, say your name is Asmy. Write short, gentle, imaginative stories appropriate for kids: no violence, no scary content, no romance, nothing frightening or adult. Use simple words, a playful tone, and positive messages (kindness, courage, friendship, curiosity). Keep each story focused and not too long. Match the language the child writes in. If asked for something unsafe or not kid-appropriate, gently redirect to a fun, safe story idea instead.`,
  },
  editphoto: {
    label: "Edit Photo",
    icon: ImageIcon,
    color: "#3D7FB3",
    subtitle: "Adjust & enhance your photos",
    greeting: "",
    system: "",
  },
};

export default function DoubtSolver() {
  const [user, setUser] = useState(null); // { name, email, method }
  const [authEmail, setAuthEmail] = useState("");
  const [mode, setMode] = useState("study");
  const [messages, setMessages] = useState({
    study: [{ role: "assistant", text: MODES.study.greeting }],
    legal: [{ role: "assistant", text: MODES.legal.greeting }],
    business: [{ role: "assistant", text: MODES.business.greeting }],
    story: [{ role: "assistant", text: MODES.story.greeting }],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  // Photo editor state
  const [editPhoto, setEditPhoto] = useState(null); // dataUrl
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
  });
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const editFileInputRef = useRef(null);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const currentMessages = messages[mode];
  const ModeIcon = MODES[mode].icon;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mode, loading]);

  function speak(text) {
    if (!speakEnabled) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceSettings = VOICES[voiceGender];
    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.rateMod;
    const voices = synth.getVoices();
    const preferred = voices.find((v) =>
      voiceGender === "female"
        ? /female|woman|samantha|zira/i.test(v.name)
        : /male|man|david|daniel/i.test(v.name)
    );
    if (preferred) utterance.voice = preferred;
    synth.speak(utterance);
  }

  // Voice input setup (Web Speech API)
  function toggleVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage({
        dataUrl: reader.result,
        base64: reader.result.split(",")[1],
        mediaType: file.type,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleEditPhotoPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditPhoto({
        dataUrl: reader.result,
        base64: reader.result.split(",")[1],
        mediaType: file.type,
      });
      setFilters({ brightness: 100, contrast: 100, saturate: 100, blur: 0 });
      setAiSuggestion("");
    };
    reader.readAsDataURL(file);
  }

  function resetFilters() {
    setFilters({ brightness: 100, contrast: 100, saturate: 100, blur: 0 });
  }

  function downloadEditedPhoto() {
    if (!editPhoto) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) blur(${filters.blur}px)`;
      ctx.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `${BRAND_NAME}-edited-photo.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = editPhoto.dataUrl;
  }

  async function getAiPhotoSuggestion() {
    if (!editPhoto || aiSuggestLoading) return;
    setAiSuggestLoading(true);
    setAiSuggestion("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:
            "You are Asmy, a friendly photo-editing assistant. Look at the photo and suggest 2-4 specific, brief edits to make it look better (e.g. brightness, contrast, cropping, composition). Keep it short and practical. Match the user's language if they wrote one, otherwise English.",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    mediaType: editPhoto.mediaType,
                    data: editPhoto.base64,
                  },
                },
                { type: "text", text: "What edits would improve this photo?" },
              ],
            },
          ],
        }),
      });
      const data = await response.json();
      const reply = data?.reply || "Couldn't generate suggestions right now.";
      setAiSuggestion(reply);
    } catch (err) {
      setAiSuggestion("Something went wrong getting suggestions.");
    } finally {
      setAiSuggestLoading(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if ((!text && !attachedImage) || loading) return;

    const userContent = [];
    if (attachedImage) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: attachedImage.mediaType,
          data: attachedImage.base64,
        },
      });
    }
    if (text) userContent.push({ type: "text", text });

    const userMsg = {
      role: "user",
      text: text || "(photo attached)",
      image: attachedImage?.dataUrl,
      apiContent: userContent,
    };

    const newMessages = [...currentMessages, userMsg];
    setMessages((prev) => ({ ...prev, [mode]: newMessages }));
    setInput("");
    setAttachedImage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: MODES[mode].system,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.apiContent || m.text,
          })),
        }),
      });
      const data = await response.json();
      const reply =
        data?.reply || "Sorry, I couldn't generate a response. Please try again.";
      setMessages((prev) => ({
        ...prev,
        [mode]: [...prev[mode], { role: "assistant", text: reply }],
      }));
      speak(reply);
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        [mode]: [
          ...prev[mode],
          {
            role: "assistant",
            text: "Something went wrong reaching the AI. Please try again.",
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!user) {
    return (
      <div
        className="min-h-screen w-full bg-[#F0F6FC] flex flex-col items-center justify-center px-6"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        `}</style>
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#2E6F9E] flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-[#F0F6FC]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#16324F] tracking-tight">
              {BRAND_NAME}
            </h1>
            <p className="text-sm text-[#5C7C99] mt-1">
              Sign in to get started
            </p>
          </div>

          <button
            onClick={() =>
              setUser({ name: "Google User", email: "you@gmail.com", method: "google" })
            }
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#D6E6F4] rounded-xl py-3 font-medium text-[#16324F] mb-3 shadow-sm hover:bg-[#EAF3FB] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#D6E6F4]" />
            <span className="text-xs text-[#8FAFC9]">or</span>
            <div className="flex-1 h-px bg-[#D6E6F4]" />
          </div>

          <input
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full bg-white border border-[#D6E6F4] rounded-xl px-4 py-3 text-[15px] text-[#16324F] placeholder:text-[#8FAFC9] outline-none mb-3 focus:border-[#2E6F9E]"
          />
          <button
            onClick={() =>
              authEmail.trim() &&
              setUser({ name: authEmail.split("@")[0], email: authEmail, method: "email" })
            }
            disabled={!authEmail.trim()}
            className="w-full rounded-xl py-3 font-semibold text-[#F0F6FC] disabled:bg-[#C5D9E8] transition-colors"
            style={{ backgroundColor: authEmail.trim() ? "#2E6F9E" : undefined }}
          >
            Continue with Email
          </button>

          <p className="text-center text-[11px] text-[#8FAFC9] mt-6">
            By continuing, you agree to {BRAND_NAME}'s Terms & Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-[#F0F6FC] flex flex-col items-center"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>
      {/* Header */}
      <div className="w-full max-w-2xl px-5 pt-8 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
            style={{ backgroundColor: MODES[mode].color }}
          >
            <ModeIcon className="w-5 h-5 text-[#F0F6FC]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#16324F] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {BRAND_NAME}
            </h1>
            <p className="text-xs font-medium text-[#5C7C99] flex items-center gap-1">
              <Globe2 className="w-3 h-3" /> {MODES[mode].subtitle}
            </p>
          </div>
        </div>

        {/* Mode switcher + voice settings */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {Object.entries(MODES).map(([key, m]) => {
              const Icon = m.icon;
              const active = key === mode;
              return (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    active
                      ? "text-white border-transparent"
                      : "text-[#5C7C99] border-[#D6E6F4] bg-white"
                  }`}
                  style={active ? { backgroundColor: m.color } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowVoiceMenu((v) => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                speakEnabled
                  ? "text-white border-transparent"
                  : "text-[#5C7C99] border-[#D6E6F4] bg-white"
              }`}
              style={speakEnabled ? { backgroundColor: MODES[mode].color } : {}}
              aria-label="Voice settings"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            {showVoiceMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-[#D6E6F4] rounded-xl shadow-md p-2 z-10">
                <button
                  onClick={() => setSpeakEnabled((v) => !v)}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-sm text-[#16324F] hover:bg-[#EAF3FB] flex items-center justify-between"
                >
                  Speak replies
                  <span
                    className={`text-xs ${
                      speakEnabled ? "text-[#2E6F9E]" : "text-[#8FAFC9]"
                    }`}
                  >
                    {speakEnabled ? "On" : "Off"}
                  </span>
                </button>
                <div className="h-px bg-[#D6E6F4] my-1" />
                {Object.entries(VOICES).map(([key, v]) => (
                  <button
                    key={key}
                    onClick={() => setVoiceGender(key)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm hover:bg-[#EAF3FB] ${
                      voiceGender === key
                        ? "text-[#2E6F9E] font-medium"
                        : "text-[#16324F]"
                    }`}
                  >
                    {v.label} voice
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {mode === "editphoto" ? (
        <div className="w-full max-w-2xl flex-1 px-5 pb-8 overflow-y-auto">
          {!editPhoto ? (
            <button
              onClick={() => editFileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#D6E6F4] rounded-2xl py-16 flex flex-col items-center gap-3 bg-white hover:bg-[#EAF3FB] transition-colors"
            >
              <ImageIcon className="w-8 h-8 text-[#5C7C99]" />
              <span className="text-sm font-medium text-[#16324F]">
                Tap to upload a photo
              </span>
              <span className="text-xs text-[#8FAFC9]">JPG or PNG</span>
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl overflow-hidden border border-[#D6E6F4] bg-white">
                <img
                  src={editPhoto.dataUrl}
                  alt="Editing"
                  className="w-full max-h-80 object-contain"
                  style={{
                    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) blur(${filters.blur}px)`,
                  }}
                />
              </div>

              {/* Filter sliders */}
              <div className="bg-white rounded-2xl border border-[#D6E6F4] p-4 flex flex-col gap-3">
                {[
                  { key: "brightness", label: "Brightness", min: 50, max: 150 },
                  { key: "contrast", label: "Contrast", min: 50, max: 150 },
                  { key: "saturate", label: "Saturation", min: 0, max: 200 },
                  { key: "blur", label: "Blur", min: 0, max: 8 },
                ].map((f) => (
                  <div key={f.key}>
                    <div className="flex justify-between text-xs font-medium text-[#5C7C99] mb-1">
                      <span>{f.label}</span>
                      <span>{filters[f.key]}</span>
                    </div>
                    <input
                      type="range"
                      min={f.min}
                      max={f.max}
                      value={filters[f.key]}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [f.key]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#2E6F9E]"
                    />
                  </div>
                ))}
                <button
                  onClick={resetFilters}
                  className="self-start text-xs font-medium text-[#2E6F9E] mt-1"
                >
                  Reset adjustments
                </button>
              </div>

              {/* AI suggestions */}
              <div className="bg-white rounded-2xl border border-[#D6E6F4] p-4">
                <button
                  onClick={getAiPhotoSuggestion}
                  disabled={aiSuggestLoading}
                  className="flex items-center gap-2 text-sm font-semibold text-[#2E6F9E] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {aiSuggestLoading ? "Analyzing photo…" : "Get AI edit suggestions"}
                </button>
                {aiSuggestion && (
                  <p className="text-sm text-[#16324F] mt-3 leading-relaxed whitespace-pre-wrap">
                    {aiSuggestion}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditPhoto(null);
                    setAiSuggestion("");
                  }}
                  className="flex-1 rounded-xl py-3 font-medium text-[#5C7C99] bg-white border border-[#D6E6F4]"
                >
                  Choose another
                </button>
                <button
                  onClick={downloadEditedPhoto}
                  className="flex-1 rounded-xl py-3 font-semibold text-[#F0F6FC]"
                  style={{ backgroundColor: MODES.editphoto.color }}
                >
                  Download
                </button>
              </div>
            </div>
          )}
          <input
            ref={editFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleEditPhotoPick}
            className="hidden"
          />
        </div>
      ) : (
        <>
          {/* Chat area */}
          <div className="w-full max-w-2xl flex-1 px-5 overflow-y-auto pb-4">
            <div className="flex flex-col gap-3">
              {currentMessages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed tracking-[-0.01em] whitespace-pre-wrap ${
                      m.role === "user"
                        ? "text-[#F0F6FC] rounded-br-sm"
                        : "bg-white text-[#16324F] border border-[#D6E6F4] rounded-bl-sm"
                    }`}
                    style={
                      m.role === "user"
                        ? { backgroundColor: MODES[mode].color }
                        : {}
                    }
                  >
                    {m.image && (
                      <img
                        src={m.image}
                        alt="Attached"
                        className="rounded-lg mb-2 max-h-48 object-cover"
                      />
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#D6E6F4] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2E6F9E] animate-pulse" />
                    <span className="text-sm text-[#5C7C99]">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {/* Input bar */}
          <div className="w-full max-w-2xl px-5 pb-6 pt-2">
            {attachedImage && (
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  <img
                    src={attachedImage.dataUrl}
                    alt="Preview"
                    className="h-14 w-14 object-cover rounded-lg border border-[#D6E6F4]"
                  />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#16324F] flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2 bg-white border border-[#D6E6F4] rounded-2xl px-3 py-2 shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[#5C7C99] hover:bg-[#EAF3FB] transition-colors"
                aria-label="Attach photo"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                onClick={toggleVoiceInput}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isRecording
                    ? "bg-red-500 text-white"
                    : "text-[#5C7C99] hover:bg-[#EAF3FB]"
                }`}
                aria-label="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={isRecording ? "Listening…" : "Type your question…"}
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-[15px] tracking-[-0.01em] text-[#16324F] placeholder:text-[#8FAFC9] py-2 max-h-32"
              />
              <button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !attachedImage)}
                className="w-9 h-9 rounded-full disabled:bg-[#C5D9E8] flex items-center justify-center shrink-0 transition-colors"
                style={{
                  backgroundColor:
                    loading || (!input.trim() && !attachedImage)
                      ? "#C5D9E8"
                      : MODES[mode].color,
                }}
                aria-label="Send"
              >
                <Send className="w-4 h-4 text-[#F0F6FC]" strokeWidth={2} />
              </button>
            </div>
            <p className="text-center text-[11px] text-[#8FAFC9] mt-2">
              {BRAND_NAME} can make mistakes.{" "}
              {mode === "legal" && "Not a substitute for a licensed lawyer."}
              {mode !== "legal" && "Check important info."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
