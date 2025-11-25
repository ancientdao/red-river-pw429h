import React, { useState, useEffect, useRef } from "react";
import {
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  History,
  User,
  Users,
  Baby,
  LogOut,
  X,
  ShieldCheck,
  Wifi,
  WifiOff,
  Plus,
  Smile,
  Cat,
  Dog,
  Rabbit,
  Fish,
  Bird,
  Lock,
  Key,
  Settings,
  Activity,
  Newspaper,
  Globe,
  Zap,
  LogIn,
  Sparkles,
  MessageCircle,
  Send,
  UserCheck,
} from "lucide-react";

// Firebase Imports
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
} from "firebase/auth";

// --- Firebase Configuration ---

const firebaseConfig = {
  apiKey: "AIzaSyDpX498B8lJghW6fwnMVFZ5YLW_c226ppw",
  authDomain: "home-bank-72dee.firebaseapp.com",
  projectId: "home-bank-72dee",
  storageBucket: "home-bank-72dee.firebasestorage.app",
  messagingSenderId: "110879199692",
  appId: "1:110879199692:web:526e893699926fed860d69",
  measurementId: "G-XB26B2RHRN",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "my-family-bank"; // 隨便取一個名字 !== 'undefined' ? __app_id : 'default-app-id';

// --- Gemini API Configuration ---
const GEMINI_API_KEY = "";
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

// --- Market Simulation Data ---
const MARKET_NEWS = [
  { min: 0, max: 2, text: "風調雨順，物價平穩，通膨受控。", trend: "stable" },
  { min: 2, max: 3, text: "國際油價小幅上漲，運費增加。", trend: "up" },
  { min: 3, max: 4, text: "颱風過境，蔬菜水果價格飆漲！", trend: "up" },
  { min: 4, max: 5, text: "供應鏈短缺，進口商品變貴了。", trend: "up" },
  {
    min: 5,
    max: 8,
    text: "發生能源危機！萬物齊漲，通膨巨獸來襲！",
    trend: "warning",
  },
  { min: 0, max: 1, text: "經濟稍微冷卻，商品正在打折促銷。", trend: "down" },
];

// --- Utility Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (val) => `${(val * 100).toFixed(1)}%`;

const formatDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const withTimeout = (promise, ms = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("連線逾時")), ms)
    ),
  ]);
};

// --- Gemini API Helper ---
const callGemini = async (prompt, systemContext) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemContext }] },
        }),
      }
    );

    if (!response.ok) throw new Error("API Error");
    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "抱歉，小豬現在有點累，請稍後再問我！"
    );
  } catch (error) {
    console.error("Gemini Error:", error);
    return "連線發生錯誤，請檢查網路或是 API 金鑰。";
  }
};

const AVATARS = {
  baby: <Baby size={32} />,
  cat: <Cat size={32} />,
  dog: <Dog size={32} />,
  rabbit: <Rabbit size={32} />,
  fish: <Fish size={32} />,
  bird: <Bird size={32} />,
  smile: <Smile size={32} />,
};

// --- Components ---

// 1. Change PIN Modal (New)
const ChangePinModal = ({ onClose, onUpdate, currentPin }) => {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (oldPin !== currentPin) {
      alert("舊密碼不正確");
      return;
    }
    if (newPin.length !== 4) {
      alert("新密碼必須是 4 位數字");
      return;
    }
    if (newPin !== confirmPin) {
      alert("兩次新密碼輸入不一致");
      return;
    }
    onUpdate(newPin);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4 text-slate-800 text-center">
          修改家長密碼
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              舊密碼
            </label>
            <input
              type="password"
              maxLength="4"
              className="w-full bg-slate-100 p-3 rounded-xl text-center font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
              placeholder="****"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              新密碼 (4位數字)
            </label>
            <input
              type="password"
              maxLength="4"
              className="w-full bg-slate-100 p-3 rounded-xl text-center font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="****"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              確認新密碼
            </label>
            <input
              type="password"
              maxLength="4"
              className="w-full bg-slate-100 p-3 rounded-xl text-center font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="****"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. Smart Piggy AI Advisor
const SmartPiggyAI = ({ userRole, userName, balance, rates, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `嗨！我是你的 AI 理財顧問「智慧小豬」🐷。${userName}，你想問我關於錢的問題嗎？`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    const systemContext = `
      你是一個專為家庭銀行 App 設計的 AI 理財顧問，名字叫「智慧小豬」。
      你的對話對象是：${
        userRole === "parent" ? "家長" : "小孩"
      }，名字叫 ${userName}。
      目前的財務狀況：
      - 餘額：${balance} 元
      - 目前市場通膨率：${formatPercent(rates.inflation)}
      - 家長加碼利息：${formatPercent(rates.bonus)}
      - 總年利率：${formatPercent(rates.inflation + rates.bonus)}

      指導原則：
      1. 如果對象是小孩，請用簡單、活潑、生動、鼓勵的語氣（可以使用 emoji）。解釋複利時可以用「錢錢生小寶寶」來比喻。
      2. 如果對象是家長，請提供教育心理學相關的建議，如何引導孩子建立金錢觀。
      3. 永遠保持正向，鼓勵儲蓄，但也要教導合理消費。
      4. 回答請簡短有力（100字以內），不要長篇大論。
    `;

    const aiResponse = await callGemini(userMsg, systemContext);
    setMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
    setLoading(false);
  };

  const suggestions =
    userRole === "child"
      ? [
          "我可以買玩具嗎？",
          "錢為什麼會變多？",
          "什麼是通膨？",
          "幫我算存錢計畫",
        ]
      : [
          "如何教孩子延遲享樂？",
          "現在的通膨率適合怎麼教？",
          "給孩子多少零用錢合適？",
        ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-full">
              <Sparkles size={20} className="text-yellow-300" />
            </div>
            <span className="font-bold text-lg">智慧小豬顧問</span>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
          ref={scrollRef}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          )}
        </div>
        {!loading && messages.length < 3 && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  handleSend();
                }}
                className="whitespace-nowrap bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 hover:bg-indigo-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="問問小豬..."
            className="flex-1 bg-slate-100 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-indigo-600 text-white p-2 rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PinPad = ({ onSuccess, onCancel, targetPin, title, subTitle }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleNum = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      if (newPin.length === 4) {
        if (newPin === targetPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(""), 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
        <h3 className="text-center font-bold text-xl mb-1 text-slate-700">
          {title || "輸入密碼"}
        </h3>
        <p className="text-center text-xs text-slate-400 mb-4">
          {subTitle || "請輸入 4 位數 PIN 碼"}
        </p>
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                pin.length > i
                  ? error
                    ? "bg-red-500"
                    : "bg-blue-600"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNum(num)}
              className="h-14 rounded-xl bg-slate-100 font-bold text-xl text-slate-700 active:bg-slate-200 active:scale-95 transition-transform"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="h-14 rounded-xl bg-red-50 text-red-500 font-bold text-sm active:bg-red-100"
          >
            取消
          </button>
          <button
            onClick={() => handleNum(0)}
            className="h-14 rounded-xl bg-slate-100 font-bold text-xl text-slate-700 active:bg-slate-200 active:scale-95 transition-transform"
          >
            0
          </button>
          <button
            onClick={() => setPin("")}
            className="h-14 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm active:bg-slate-200"
          >
            清除
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateUserModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [icon, setIcon] = useState("smile");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && pin.length === 4) onCreate(name, icon, pin);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">新增家庭成員</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              名稱
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：哥哥"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              設定密碼 (4位數字)
            </label>
            <input
              type="text"
              maxLength="4"
              pattern="\d{4}"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold tracking-widest text-center"
              placeholder="0000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              選擇頭像
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {Object.keys(AVATARS).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
                    icon === key
                      ? "bg-blue-100 text-blue-600 ring-2 ring-blue-500"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  {React.cloneElement(AVATARS[key], { size: 24 })}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-500 font-bold"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              建立
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CentralBankControl = ({ rates, onUpdateRates, onToggleAuto }) => {
  const [inflation, setInflation] = useState(rates.inflation * 100);
  const [bonus, setBonus] = useState(rates.bonus * 100);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setInflation((rates.inflation * 100).toFixed(1));
    setBonus((rates.bonus * 100).toFixed(1));
  }, [rates]);

  const handleSave = () => {
    onUpdateRates(parseFloat(inflation) / 100, parseFloat(bonus) / 100);
    setIsOpen(false);
  };

  const total = parseFloat(inflation) + parseFloat(bonus);
  const isAuto = rates.isAuto;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-white p-4 rounded-2xl flex items-center justify-between shadow-lg transition-colors ${
          isAuto ? "bg-indigo-600" : "bg-slate-800"
        }`}
      >
        <div className="flex items-center gap-3">
          {isAuto ? (
            <Globe className="text-white animate-pulse" />
          ) : (
            <Settings className="text-emerald-400" />
          )}
          <div className="text-left">
            <div className="text-xs text-indigo-200 font-bold uppercase tracking-wider flex items-center gap-1">
              {isAuto ? "自動市場模式" : "手動央行模式"}
            </div>
            <div className="text-xl font-bold flex items-center gap-2">
              CPI: {formatPercent(rates.inflation)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70">總利率</div>
          <div className="font-bold text-lg">
            {formatPercent(rates.inflation + rates.bonus)}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="mt-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-6 bg-slate-50 p-3 rounded-xl">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <Zap
                size={18}
                className={isAuto ? "text-indigo-500" : "text-slate-400"}
              />
              自動調節通膨
            </span>
            <button
              onClick={() => onToggleAuto(!isAuto)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAuto ? "bg-indigo-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAuto ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div
            className={`space-y-6 ${
              isAuto ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-bold text-red-500 flex items-center gap-1">
                  <TrendingUp size={16} /> 通膨率 (CPI)
                </label>
                <span className="font-bold text-slate-700">{inflation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={inflation}
                onChange={(e) => setInflation(e.target.value)}
                className="w-full accent-red-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck size={16} /> 家長加碼
                </label>
                <span className="font-bold text-slate-700">
                  {bonus > 0 ? "+" : ""}
                  {bonus}%
                </span>
              </div>
              <input
                type="range"
                min="-5"
                max="15"
                step="0.5"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSave}
                className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900"
              >
                更新設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NewsTicker = ({ news }) => {
  if (!news) return null;
  return (
    <div className="bg-slate-900 text-white text-xs py-2 px-4 overflow-hidden whitespace-nowrap relative">
      <div className="flex items-center gap-4 animate-in slide-in-from-right duration-1000">
        <span className="bg-red-500 text-white px-1.5 rounded font-bold text-[10px]">
          BREAKING
        </span>
        <span>{news}</span>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, onGuestLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl text-center">
        <div className="bg-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
          <PiggyBank size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">家庭銀行</h1>
        <p className="text-slate-500 mb-8">建立您專屬的虛擬家庭銀行</p>

        <div className="space-y-4">
          <button
            onClick={onLogin}
            className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="w-6 h-6"
              alt="Google"
            />
            使用 Google 帳號登入
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-300 text-xs uppercase">
              或
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            onClick={onGuestLogin}
            className="w-full bg-slate-100 text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <UserCheck size={18} />
            訪客體驗模式
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-6 leading-relaxed">
          Google 登入需要於 Firebase Console 啟用。
          <br />
          訪客資料僅供測試，清除瀏覽器後可能會消失。
        </p>
      </div>
    </div>
  );
};

// --- Main Application ---
export default function FamilyBankApp() {
  const [googleUser, setGoogleUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // App Logic States
  const [role, setRole] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [pinPadConfig, setPinPadConfig] = useState(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false); // New: Show Change PIN Modal

  // Data State
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [rates, setRates] = useState({
    inflation: 0.03,
    bonus: 0.05,
    isAuto: true,
    news: "市場觀察中...",
    lastUpdate: 0,
  });
  const [parentPin, setParentPin] = useState("8888"); // New: Parent PIN state

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [transType, setTransType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setGoogleUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setRole(null);
        setSelectedAccount(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Loading
  useEffect(() => {
    if (!googleUser) return;

    // Load Members
    const membersRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      googleUser.uid,
      "members"
    );
    const unsubAcc = onSnapshot(membersRef, (snapshot) => {
      setAccounts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Load Rates
    const ratesRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      googleUser.uid,
      "settings",
      "rates"
    );
    const unsubRates = onSnapshot(ratesRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRates(data);
        if (data.isAuto) {
          const now = Date.now();
          if (now - (data.lastUpdate || 0) > 24 * 60 * 60 * 1000) {
            updateMarketConditions(data.inflation);
          }
        }
      } else {
        setDoc(ratesRef, {
          inflation: 0.025,
          bonus: 0.05,
          isAuto: true,
          news: "新的一天，市場觀察中。",
          lastUpdate: Date.now(),
        }).catch(console.error);
      }
    });

    // New: Load Security Settings (Parent PIN)
    const securityRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      googleUser.uid,
      "settings",
      "security"
    );
    const unsubSecurity = onSnapshot(securityRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().pin) {
        setParentPin(docSnap.data().pin);
      } else {
        // If no PIN set, ensure it's default 8888 in state, but no need to write to DB yet unless user changes it
        setParentPin("8888");
      }
    });

    return () => {
      unsubAcc();
      unsubRates();
      unsubSecurity();
    };
  }, [googleUser]);

  const updateMarketConditions = async (currentCPI) => {
    if (!googleUser) return;
    const drift = (Math.random() - 0.5) * 0.03;
    let newCPI = Math.max(0.005, Math.min(0.08, currentCPI + drift));
    const cpiPercent = newCPI * 100;
    const newsItem =
      MARKET_NEWS.find((n) => cpiPercent >= n.min && cpiPercent < n.max) ||
      MARKET_NEWS[0];

    try {
      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          googleUser.uid,
          "settings",
          "rates"
        ),
        {
          inflation: newCPI,
          news: `今日 CPI ${cpiPercent.toFixed(1)}%。${newsItem.text}`,
          lastUpdate: Date.now(),
        }
      );
    } catch (e) {
      console.error("Market Update Failed", e);
    }
  };

  // 3. Transactions
  useEffect(() => {
    if (!googleUser || !selectedAccount) {
      setTransactions([]);
      return;
    }

    const txRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      googleUser.uid,
      "transactions"
    );
    const unsub = onSnapshot(txRef, (snapshot) => {
      const allTx = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const accountTx = allTx
        .filter((t) => t.memberId === selectedAccount.id)
        .sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(accountTx);
    });
    return () => unsub();
  }, [googleUser, selectedAccount]);

  // 4. Balance & Interest
  useEffect(() => {
    if (!selectedAccount || !googleUser) return;

    const newBalance = transactions.reduce((acc, t) => {
      const val = parseFloat(t.amount);
      return t.type === "income" || t.type === "interest"
        ? acc + val
        : acc - val;
    }, 0);
    setBalance(newBalance);

    const checkInterest = async () => {
      const lastDate = selectedAccount.lastInterestDate || Date.now();
      const now = Date.now();
      const daysPassed = Math.floor((now - lastDate) / (24 * 60 * 60 * 1000));
      const currentRate = rates.inflation + rates.bonus;

      if (daysPassed >= 1) {
        const memberRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          googleUser.uid,
          "members",
          selectedAccount.id
        );
        const txRef = collection(
          db,
          "artifacts",
          appId,
          "users",
          googleUser.uid,
          "transactions"
        );

        try {
          await updateDoc(memberRef, { lastInterestDate: now });
          if (newBalance > 0) {
            const interestEarned = Math.floor(
              newBalance * (currentRate / 365) * daysPassed
            );
            if (interestEarned > 0) {
              await addDoc(txRef, {
                type: "interest",
                amount: interestEarned,
                note: `利息 (通膨${formatPercent(
                  rates.inflation
                )} + 加碼${formatPercent(rates.bonus)})`,
                timestamp: now,
                memberId: selectedAccount.id,
                by: "system",
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkInterest();
  }, [transactions, selectedAccount, rates, googleUser]);

  // --- Actions ---
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      let msg = "登入失敗：" + error.message;
      if (error.code === "auth/popup-blocked")
        msg = "登入視窗被瀏覽器阻擋，請允許彈出式視窗。";
      if (error.code === "auth/operation-not-allowed")
        msg =
          "Google 登入未啟用，請至 Firebase Console > Authentication > Sign-in method 開啟。";
      if (error.code === "auth/unauthorized-domain")
        msg =
          "網域未授權，請至 Firebase Console > Authentication > Settings 新增此網域。";
      alert(msg);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Guest login failed", error);
      alert("訪客登入失敗，請稍後再試");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleUpdateRates = async (inf, bonus) => {
    if (!googleUser) return;
    await updateDoc(
      doc(db, "artifacts", appId, "users", googleUser.uid, "settings", "rates"),
      { inflation: inf, bonus: bonus }
    );
  };

  const handleToggleAuto = async (isAuto) => {
    if (!googleUser) return;
    await updateDoc(
      doc(db, "artifacts", appId, "users", googleUser.uid, "settings", "rates"),
      { isAuto }
    );
    if (isAuto) updateMarketConditions(rates.inflation);
  };

  const handleUpdateParentPin = async (newPin) => {
    if (!googleUser) return;
    try {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          googleUser.uid,
          "settings",
          "security"
        ),
        { pin: newPin },
        { merge: true }
      );
      alert("密碼修改成功！");
      setShowChangePin(false);
    } catch (e) {
      console.error("Failed to update PIN", e);
      alert("修改失敗，請稍後再試");
    }
  };

  const handleCreateMember = async (name, icon, pin) => {
    if (!googleUser) return;
    await addDoc(
      collection(db, "artifacts", appId, "users", googleUser.uid, "members"),
      {
        name,
        icon,
        pin,
        createdAt: Date.now(),
        lastInterestDate: Date.now(),
      }
    );
    setShowCreateUser(false);
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isSubmitting || !selectedAccount || !googleUser) return;
    setIsSubmitting(true);
    try {
      const num = parseFloat(amount);
      if (transType === "expense" && num > balance) {
        alert("餘額不足");
        setIsSubmitting(false);
        return;
      }

      await withTimeout(
        addDoc(
          collection(
            db,
            "artifacts",
            appId,
            "users",
            googleUser.uid,
            "transactions"
          ),
          {
            type: transType,
            amount: num,
            note: note || (transType === "income" ? "零用錢" : "消費"),
            timestamp: Date.now(),
            memberId: selectedAccount.id,
            by: role,
          }
        )
      );
      setAmount("");
      setNote("");
      setIsTxModalOpen(false);
    } catch {
      alert("交易失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Views ---

  if (!authReady)
    return (
      <div className="h-screen flex items-center justify-center">
        <Wifi className="animate-pulse text-slate-400" />
      </div>
    );

  if (!googleUser)
    return (
      <LoginScreen
        onLogin={handleGoogleLogin}
        onGuestLogin={handleGuestLogin}
      />
    );

  // 2. Logged In -> Role Selection
  if (!role && !selectedAccount) {
    return (
      <div className="min-h-screen bg-slate-100 pb-10">
        <NewsTicker news={rates.news} />
        <div className="flex items-center justify-center p-4 min-h-[80vh]">
          <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center relative">
            <button
              onClick={handleLogout}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"
            >
              <LogOut size={20} />
            </button>

            <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-300">
              <TrendingUp size={40} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">家庭銀行</h1>
            <p className="text-xs text-slate-400 mb-6">
              已登入:{" "}
              {googleUser.isAnonymous ? "訪客模式" : googleUser.displayName}
            </p>
            <p className="text-slate-500 text-sm mb-8">
              今日通膨：
              <span className="text-red-500 font-bold">
                {formatPercent(rates.inflation)}
              </span>
            </p>

            <button
              onClick={() =>
                setPinPadConfig({
                  targetPin: parentPin,
                  title: "家長登入",
                  subTitle: "請輸入管理員 PIN",
                  onSuccess: () => {
                    setRole("parent");
                    setPinPadConfig(null);
                  },
                })
              }
              className="w-full mb-6 p-4 bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-lg active:scale-95"
            >
              <ShieldCheck size={20} />{" "}
              <span className="font-bold">我是家長 (管理)</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-widest">
                點擊頭像登入
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    if (role === "parent") {
                      setSelectedAccount(acc);
                      return;
                    }
                    setPinPadConfig({
                      targetPin: acc.pin || "0000",
                      title: acc.name,
                      subTitle: "請輸入 PIN 碼",
                      onSuccess: () => {
                        setRole("child");
                        setSelectedAccount(acc);
                        setPinPadConfig(null);
                      },
                    });
                  }}
                  className="bg-white border-2 border-slate-100 p-4 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all flex flex-col items-center"
                >
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-full mb-2">
                    {AVATARS[acc.icon] || <User size={20} />}
                  </div>
                  <span className="font-bold text-slate-700 text-sm">
                    {acc.name}
                  </span>
                </button>
              ))}
              {accounts.length === 0 && (
                <div className="col-span-2 text-slate-400 text-sm py-4">
                  請家長建立第一個成員
                </div>
              )}
            </div>
          </div>
        </div>
        {pinPadConfig && (
          <PinPad {...pinPadConfig} onCancel={() => setPinPadConfig(null)} />
        )}
      </div>
    );
  }

  // 3. Parent Dashboard
  if (role === "parent" && !selectedAccount) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NewsTicker news={rates.news} />
        <div className="p-6">
          <header className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <ShieldCheck size={18} />{" "}
                <span className="text-sm font-bold">總裁控制台</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">市場與帳戶</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowChangePin(true)}
                className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <Key size={20} />
              </button>
              <button
                onClick={() => setRole(null)}
                className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <LogOut size={20} />
              </button>
            </div>
          </header>
          <CentralBankControl
            rates={rates}
            onUpdateRates={handleUpdateRates}
            onToggleAuto={handleToggleAuto}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccount(acc)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all flex flex-col items-center relative"
              >
                <div className="p-4 rounded-full mb-3 bg-blue-100 text-blue-600">
                  {AVATARS[acc.icon] || <User />}
                </div>
                <span className="font-bold text-slate-700">{acc.name}</span>
              </button>
            ))}
            <button
              onClick={() => setShowCreateUser(true)}
              className="bg-slate-100 border-2 border-dashed border-slate-300 p-6 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-200 transition-all"
            >
              <Plus size={32} className="mb-3" />{" "}
              <span className="font-bold">新增成員</span>
            </button>
          </div>
          {showCreateUser && (
            <CreateUserModal
              onClose={() => setShowCreateUser(false)}
              onCreate={handleCreateMember}
            />
          )}
          {showChangePin && (
            <ChangePinModal
              onClose={() => setShowChangePin(false)}
              onUpdate={handleUpdateParentPin}
              currentPin={parentPin}
            />
          )}
        </div>
      </div>
    );
  }

  // 4. Detail View
  const isParentView = role === "parent";
  const monthlyInterestProj = Math.floor(
    (balance * (rates.inflation + rates.bonus)) / 12
  );
  const totalRate = rates.inflation + rates.bonus;

  return (
    <div
      className={`min-h-screen pb-20 font-sans transition-colors duration-500 ${
        isParentView ? "bg-slate-50" : "bg-sky-50"
      }`}
    >
      <NewsTicker news={rates.news} />
      <header
        className={`p-6 rounded-b-3xl shadow-lg transition-colors duration-500 ${
          isParentView ? "bg-slate-800 text-white" : "bg-blue-500 text-white"
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <button
            onClick={() => {
              setSelectedAccount(null);
              if (!isParentView) setRole(null);
            }}
            className="flex items-center gap-1 text-sm font-bold opacity-80 hover:opacity-100 bg-black/10 px-3 py-1 rounded-full"
          >
            <LogOut size={14} /> {isParentView ? "返回列表" : "登出"}
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{selectedAccount.name}</span>
            <div className="p-1 bg-white/20 rounded-full">
              {React.cloneElement(AVATARS[selectedAccount.icon] || <User />, {
                size: 20,
              })}
            </div>
          </div>
        </div>
        <div>
          <span className="text-sm opacity-80">
            {isParentView ? "目前餘額" : "我的存款"}
          </span>
          <h2 className="text-5xl font-bold tracking-tight mt-1">
            {formatCurrency(balance)}
          </h2>
          {!isParentView && (
            <div className="mt-2 text-sm bg-white/20 inline-block px-2 py-1 rounded-lg">
              年利率: {formatPercent(totalRate)}
            </div>
          )}
        </div>
      </header>

      <main className="p-5 max-w-lg mx-auto space-y-4">
        {!isParentView && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden mb-4">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Newspaper size={18} className="text-blue-500" /> 今日市場報告
            </h3>
            <div className="bg-slate-100 p-3 rounded-xl text-sm text-slate-600 mb-4 font-bold">
              {rates.news}
            </div>
            <div className="flex items-center gap-1 h-6 w-full rounded-full overflow-hidden bg-slate-100">
              <div
                style={{
                  width: `${
                    (rates.inflation / Math.max(totalRate, 0.15)) * 100
                  }%`,
                }}
                className="h-full bg-red-400 transition-all duration-1000"
              ></div>
              <div
                style={{
                  width: `${(rates.bonus / Math.max(totalRate, 0.15)) * 100}%`,
                }}
                className="h-full bg-emerald-400 transition-all duration-1000"
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>通膨 {formatPercent(rates.inflation)}</span>
              <span>爸媽加碼 {formatPercent(rates.bonus)}</span>
            </div>
          </div>
        )}

        {/* AI Advisor Button ✨ */}
        <button
          onClick={() => setShowAiChat(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg hover:shadow-xl transition-all active:scale-95 group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full group-hover:rotate-12 transition-transform">
              <Sparkles size={24} className="text-yellow-300" />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">智慧小豬顧問</div>
              <div className="text-xs text-purple-200">
                AI 幫你算利息、回答問題！
              </div>
            </div>
          </div>
          <MessageCircle size={24} />
        </button>

        <div className="grid grid-cols-1 gap-4">
          {isParentView ? (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-slate-500 text-sm font-bold mb-3 uppercase tracking-wider">
                資金管理
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setTransType("income");
                    setIsTxModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl flex flex-col items-center gap-1 shadow-md active:scale-95 transition-all"
                >
                  <ArrowUpCircle size={24} />{" "}
                  <span className="font-bold">存入零用錢</span>
                </button>
                <button
                  onClick={() => {
                    setTransType("expense");
                    setIsTxModalOpen(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all"
                >
                  <ArrowDownCircle size={24} />{" "}
                  <span className="font-bold">扣款 / 修正</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    下個月預計利息
                  </div>
                  <div className="text-2xl font-bold text-emerald-500">
                    +{formatCurrency(monthlyInterestProj)}
                  </div>
                </div>
                <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                  <TrendingUp />
                </div>
              </div>
              <button
                onClick={() => {
                  setTransType("expense");
                  setIsTxModalOpen(true);
                }}
                className="w-full bg-white hover:bg-rose-50 text-rose-500 border-2 border-rose-100 py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm active:scale-95 transition-all"
              >
                <ArrowDownCircle size={24} /> 我要花錢
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <History size={18} /> 交易紀錄
            </h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">尚無紀錄</div>
            ) : (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        t.type === "income"
                          ? "bg-blue-100 text-blue-600"
                          : t.type === "interest"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {t.type === "income" ? (
                        <ArrowUpCircle size={20} />
                      ) : t.type === "expense" ? (
                        <ArrowDownCircle size={20} />
                      ) : (
                        <Activity size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">
                        {t.note}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(t.timestamp)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${
                      t.type === "expense"
                        ? "text-rose-500"
                        : t.type === "interest"
                        ? "text-emerald-600"
                        : "text-blue-600"
                    }`}
                  >
                    {t.type === "expense" ? "-" : "+"}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {transType === "income" ? "存入" : "扣除"}
              </h3>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTransaction} className="space-y-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full text-4xl font-bold text-slate-800 border-b-2 border-slate-100 focus:border-blue-500 outline-none py-2"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="備註"
                className="w-full bg-slate-50 rounded-xl p-3 outline-none"
              />
              <button
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg mt-4 ${
                  transType === "income" ? "bg-blue-600" : "bg-rose-500"
                }`}
              >
                確認
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAiChat && (
        <SmartPiggyAI
          userRole={role}
          userName={selectedAccount.name}
          balance={balance}
          rates={rates}
          onClose={() => setShowAiChat(false)}
        />
      )}
      {/* Change PIN Modal */}
      {showChangePin && (
        <ChangePinModal
          onClose={() => setShowChangePin(false)}
          onUpdate={handleUpdateParentPin}
          currentPin={parentPin}
        />
      )}
    </div>
  );
}
