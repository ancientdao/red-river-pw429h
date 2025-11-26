import React, { useState, useEffect, useRef, useMemo } from "react";
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
  AlertCircle,
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
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- Gemini API Configuration (Robust Load) ---
// v13 修改：使用更直接的方式讀取，並透過 try-catch 處理 CodeSandbox 的錯誤
const getApiKey = () => {
  try {
    // Vercel 在打包時會尋找這個特定的字串進行替換
    // 我們不檢查 process 是否存在，直接存取，讓 catch 去處理錯誤
    const key = process.env.REACT_APP_GEMINI_API_KEY;
    if (key) return key;
  } catch (e) {
    // 在純瀏覽器環境忽略錯誤
    console.log("Env var read failed (expected in sandbox):", e);
  }
  return "";
};

const GEMINI_API_KEY = getApiKey();
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

// Debugging Log
console.log(
  "App Loaded. API Key status:",
  GEMINI_API_KEY
    ? "Loaded (Length: " + GEMINI_API_KEY.length + ")"
    : "Not Found"
);

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

const withTimeout = (promise, ms = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("連線逾時")), ms)
    ),
  ]);
};

// --- Gemini API Helper ---
const callGemini = async (prompt, systemContext) => {
  if (!GEMINI_API_KEY) {
    return "錯誤：找不到金鑰 (Key Not Found)。請檢查 Vercel 環境變數設定。";
  }

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

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API Error:", errData);
      throw new Error(
        `API Error: ${response.status} - ${errData.error?.message || "Unknown"}`
      );
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "小豬正在思考...";
  } catch (error) {
    console.error("Gemini Call Failed:", error);
    return `連線失敗 (${error.message})。請稍後再試。`;
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

const SavingsChart = ({ transactions }) => {
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const sortedTxs = [...transactions].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    let currentBal = 0;
    const points = [];
    sortedTxs.forEach((t) => {
      const val = parseFloat(t.amount);
      if (t.type === "income" || t.type === "interest") currentBal += val;
      else currentBal -= val;
      points.push({ date: t.timestamp, value: Math.max(0, currentBal) });
    });
    return points.slice(-20);
  }, [transactions]);

  if (data.length < 2) return null;

  const width = 300;
  const height = 100;
  const padding = 5;
  const maxVal = Math.max(...data.map((d) => d.value)) * 1.1;
  const minVal = 0;
  const minTime = data[0].date;
  const maxTime = data[data.length - 1].date;
  const timeRange = maxTime - minTime;

  const getX = (time) =>
    ((time - minTime) / (timeRange || 1)) * (width - padding * 2) + padding;
  const getY = (val) =>
    height -
    ((val - minVal) / (maxVal - minVal || 1)) * (height - padding * 2) -
    padding;

  let pathD = `M ${getX(data[0].date)} ${getY(data[0].value)}`;
  data.forEach((d) => {
    pathD += ` L ${getX(d.date)} ${getY(d.value)}`;
  });
  const areaD = `${pathD} L ${getX(
    data[data.length - 1].date
  )} ${height} L ${getX(data[0].date)} ${height} Z`;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
      <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm">
        <TrendingUp size={16} className="text-emerald-500" /> 財富成長曲線
      </h3>
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#chartGradient)" stroke="none" />
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={getX(data[data.length - 1].date)}
            cy={getY(data[data.length - 1].value)}
            r="3"
            fill="#10b981"
          />
        </svg>
      </div>
    </div>
  );
};

const ChangePinModal = ({ onClose, onUpdate, currentPin }) => {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4 text-slate-800 text-center">
          修改家長密碼
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (oldPin !== currentPin) return alert("舊密碼不正確");
            if (newPin.length !== 4) return alert("新密碼必須是 4 位數字");
            if (newPin !== confirmPin) return alert("兩次新密碼不一致");
            onUpdate(newPin);
          }}
          className="space-y-4"
        >
          <input
            type="password"
            maxLength="4"
            className="w-full bg-slate-100 p-3 rounded-xl text-center font-bold outline-none"
            value={oldPin}
            onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
            placeholder="舊密碼"
          />
          <input
            type="password"
            maxLength="4"
            className="w-full bg-slate-100 p-3 rounded-xl text-center font-bold outline-none"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
            placeholder="新密碼"
          />
          <input
            type="password"
            maxLength="4"
            className="w-full bg-slate-100 p-3 rounded-xl text-center font-bold outline-none"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
            placeholder="確認新密碼"
          />
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-slate-500 font-bold"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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

    const context = `你是一個專為家庭銀行 App 設計的 AI 理財顧問「智慧小豬」。對象：${
      userRole === "parent" ? "家長" : "小孩"
    } (${userName})。財務狀況：餘額 ${balance}元，通膨率 ${formatPercent(
      rates.inflation
    )}，加碼利息 ${formatPercent(
      rates.bonus
    )}。原則：鼓勵儲蓄，解釋複利，語氣活潑。`;
    const res = await callGemini(userMsg, context);
    setMessages((prev) => [...prev, { role: "ai", text: res }]);
    setLoading(false);
  };

  const suggestions =
    userRole === "child"
      ? ["我可以買玩具嗎？", "錢為什麼會變多？", "什麼是通膨？"]
      : ["如何教孩子延遲享樂？", "現在的通膨率適合怎麼教？"];

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 flex justify-between items-center text-white">
          <span className="font-bold text-lg flex items-center gap-2">
            <Sparkles size={20} /> 智慧小豬顧問
          </span>
          <button onClick={onClose}>
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
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-700 shadow-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-xs text-slate-400 px-4">小豬輸入中...</div>
          )}
        </div>
        {!loading && messages.length < 3 && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="whitespace-nowrap bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold mr-2"
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
            className="flex-1 bg-slate-100 rounded-xl px-4 py-2 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-indigo-600 text-white p-2 rounded-xl"
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
  const handleNum = (n) => {
    const next = pin + n;
    if (next.length <= 4) {
      setPin(next);
      if (next.length === 4) {
        if (next === targetPin) onSuccess();
        else setTimeout(() => setPin(""), 500);
      }
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
        <h3 className="text-center font-bold text-xl mb-1">{title}</h3>
        <p className="text-center text-xs text-slate-400 mb-4">{subTitle}</p>
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                pin.length > i ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleNum(n)}
              className="h-14 bg-slate-100 rounded-xl font-bold text-xl"
            >
              {n}
            </button>
          ))}
          <button onClick={onCancel} className="h-14 text-red-500 font-bold">
            取消
          </button>
          <button
            onClick={() => handleNum(0)}
            className="h-14 bg-slate-100 rounded-xl font-bold text-xl"
          >
            0
          </button>
          <button
            onClick={() => setPin("")}
            className="h-14 text-slate-500 font-bold"
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
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold mb-4">新增家庭成員</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name && pin.length === 4) onCreate(name, icon, pin);
          }}
          className="space-y-4"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-slate-50 rounded-xl"
            placeholder="名稱"
            required
          />
          <input
            type="text"
            maxLength="4"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="w-full p-3 bg-slate-50 rounded-xl"
            placeholder="4位數密碼"
            required
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.keys(AVATARS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setIcon(k)}
                className={`p-3 rounded-xl ${
                  icon === k ? "bg-blue-100 ring-2 ring-blue-500" : ""
                }`}
              >
                {React.cloneElement(AVATARS[k], { size: 24 })}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-500"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl"
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
  const [isOpen, setIsOpen] = useState(false);
  const [inflation, setInflation] = useState(rates.inflation * 100);
  const [bonus, setBonus] = useState(rates.bonus * 100);
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-white p-4 rounded-2xl flex items-center justify-between shadow-lg ${
          rates.isAuto ? "bg-indigo-600" : "bg-slate-800"
        }`}
      >
        <div className="flex items-center gap-3">
          {rates.isAuto ? <Globe className="animate-pulse" /> : <Settings />}
          <div className="text-left">
            <div className="text-xs font-bold uppercase">
              {rates.isAuto ? "自動市場模式" : "手動央行模式"}
            </div>
            <div className="text-xl font-bold">
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
        <div className="mt-2 bg-white p-4 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <Zap size={18} /> 自動調節
            </span>
            <button
              onClick={() => onToggleAuto(!rates.isAuto)}
              className={`w-11 h-6 rounded-full relative transition-colors ${
                rates.isAuto ? "bg-indigo-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  rates.isAuto ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          {!rates.isAuto && (
            <>
              <div>
                <label className="text-xs font-bold text-red-500">
                  通膨率 {inflation}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={inflation}
                  onChange={(e) => setInflation(e.target.value)}
                  className="w-full accent-red-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-emerald-600">
                  加碼 {bonus}%
                </label>
                <input
                  type="range"
                  min="-5"
                  max="15"
                  step="0.5"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="w-full accent-emerald-500"
                />
              </div>
              <button
                onClick={() => {
                  onUpdateRates(inflation / 100, bonus / 100);
                  setIsOpen(false);
                }}
                className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold"
              >
                更新設定
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const NewsTicker = ({ news }) => (
  <div className="bg-slate-900 text-white text-xs py-2 px-4 overflow-hidden whitespace-nowrap">
    <div className="flex items-center gap-4 animate-in slide-in-from-right duration-1000">
      <span className="bg-red-500 px-1.5 rounded font-bold">BREAKING</span>
      {news}
    </div>
  </div>
);

const LoginScreen = ({ onLogin, onGuestLogin }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl text-center space-y-4">
      <div className="bg-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg">
        <PiggyBank size={48} className="text-white" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800">家庭銀行 v13.0</h1>
      <p className="text-slate-500 mb-8">建立您專屬的虛擬家庭銀行</p>
      <button
        onClick={onLogin}
        className="w-full bg-white border border-slate-200 font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          className="w-6 h-6"
          alt="Google"
        />{" "}
        使用 Google 帳號登入
      </button>
      <button
        onClick={onGuestLogin}
        className="w-full bg-slate-100 text-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
      >
        <UserCheck size={18} /> 訪客體驗模式
      </button>
    </div>
  </div>
);

export default function FamilyBankApp() {
  const [googleUser, setGoogleUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [pinPadConfig, setPinPadConfig] = useState(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
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
  const [parentPin, setParentPin] = useState("8888");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [transType, setTransType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setGoogleUser(u);
      setAuthReady(true);
      if (!u) {
        setRole(null);
        setSelectedAccount(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!googleUser) return;
    const unsubAcc = onSnapshot(
      collection(db, "artifacts", appId, "users", googleUser.uid, "members"),
      (s) => setAccounts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const ratesRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      googleUser.uid,
      "settings",
      "rates"
    );
    const unsubRates = onSnapshot(ratesRef, (s) => {
      if (s.exists()) {
        const d = s.data();
        setRates(d);
        if (d.isAuto && Date.now() - (d.lastUpdate || 0) > 86400000)
          updateMarketConditions(d.inflation);
      } else
        setDoc(ratesRef, {
          inflation: 0.025,
          bonus: 0.05,
          isAuto: true,
          news: "市場觀察中...",
          lastUpdate: Date.now(),
        });
    });
    const unsubSec = onSnapshot(
      doc(
        db,
        "artifacts",
        appId,
        "users",
        googleUser.uid,
        "settings",
        "security"
      ),
      (s) => setParentPin(s.exists() ? s.data().pin : "8888")
    );
    return () => {
      unsubAcc();
      unsubRates();
      unsubSec();
    };
  }, [googleUser]);

  const updateMarketConditions = async (current) => {
    if (!googleUser) return;
    const drift = (Math.random() - 0.5) * 0.03;
    let newCPI = Math.max(0.005, Math.min(0.08, current + drift));
    const item =
      MARKET_NEWS.find((n) => newCPI * 100 >= n.min && newCPI * 100 < n.max) ||
      MARKET_NEWS[0];
    await updateDoc(
      doc(db, "artifacts", appId, "users", googleUser.uid, "settings", "rates"),
      {
        inflation: newCPI,
        news: `今日 CPI ${(newCPI * 100).toFixed(1)}%。${item.text}`,
        lastUpdate: Date.now(),
      }
    );
  };

  useEffect(() => {
    if (!googleUser || !selectedAccount) {
      setTransactions([]);
      return;
    }
    return onSnapshot(
      collection(
        db,
        "artifacts",
        appId,
        "users",
        googleUser.uid,
        "transactions"
      ),
      (s) => {
        const txs = s.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((t) => t.memberId === selectedAccount.id)
          .sort((a, b) => a.timestamp - b.timestamp);
        setTransactions(txs);
      }
    );
  }, [googleUser, selectedAccount]);

  useEffect(() => {
    if (!selectedAccount || !googleUser) return;
    const bal = transactions.reduce(
      (acc, t) =>
        t.type === "income" || t.type === "interest"
          ? acc + parseFloat(t.amount)
          : acc - parseFloat(t.amount),
      0
    );
    setBalance(bal);
    const checkInterest = async () => {
      const last = selectedAccount.lastInterestDate || Date.now();
      const now = Date.now();
      const days = Math.floor((now - last) / 86400000);
      const rate = rates.inflation + rates.bonus;
      if (days >= 1) {
        const memRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          googleUser.uid,
          "members",
          selectedAccount.id
        );
        await updateDoc(memRef, { lastInterestDate: now });
        if (bal > 0) {
          const dailyRate = rate / 365;
          const earned = Math.floor(bal * (Math.pow(1 + dailyRate, days) - 1));
          if (earned > 0) {
            await addDoc(
              collection(
                db,
                "artifacts",
                appId,
                "users",
                googleUser.uid,
                "transactions"
              ),
              {
                type: "interest",
                amount: earned,
                note: `複利收入 (${(rate * 100).toFixed(1)}%, ${days}天)`,
                timestamp: now,
                memberId: selectedAccount.id,
                by: "system",
              }
            );
          }
        }
      }
    };
    checkInterest();
  }, [transactions, selectedAccount, rates, googleUser]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      alert(e.message);
    }
  };
  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      alert(e.message);
    }
  };
  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;
    setIsSubmitting(true);
    try {
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
            amount: parseFloat(amount),
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

  if (!role && !selectedAccount) {
    return (
      <div className="min-h-screen bg-slate-100 pb-10">
        <NewsTicker news={rates.news} />
        <div className="flex items-center justify-center p-4 min-h-[80vh]">
          <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center space-y-6">
            <div className="flex justify-end">
              <button onClick={() => signOut(auth)}>
                <LogOut size={20} className="text-slate-300" />
              </button>
            </div>
            <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp size={40} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">家庭銀行</h1>
            <p className="text-sm text-slate-500">
              通膨率:{" "}
              <span className="text-red-500 font-bold">
                {formatPercent(rates.inflation)}
              </span>
            </p>
            <button
              onClick={() =>
                setPinPadConfig({
                  targetPin: parentPin,
                  title: "家長登入",
                  subTitle: "輸入 PIN",
                  onSuccess: () => {
                    setRole("parent");
                    setPinPadConfig(null);
                  },
                })
              }
              className="w-full p-4 bg-slate-800 text-white rounded-2xl font-bold flex justify-center gap-2"
            >
              <ShieldCheck /> 家長管理
            </button>
            <div className="grid grid-cols-2 gap-3">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    if (role === "parent") setSelectedAccount(acc);
                    else
                      setPinPadConfig({
                        targetPin: acc.pin || "0000",
                        title: acc.name,
                        subTitle: "輸入 PIN",
                        onSuccess: () => {
                          setRole("child");
                          setSelectedAccount(acc);
                          setPinPadConfig(null);
                        },
                      });
                  }}
                  className="bg-white border-2 p-4 rounded-2xl hover:border-blue-300 flex flex-col items-center"
                >
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-full mb-2">
                    {AVATARS[acc.icon] || <User />}
                  </div>
                  <span className="font-bold">{acc.name}</span>
                </button>
              ))}
              {accounts.length === 0 && (
                <div className="col-span-2 text-slate-400 text-sm">
                  請家長建立成員
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

  if (role === "parent" && !selectedAccount) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <header className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex gap-2 items-center">
            <ShieldCheck /> 總裁控制台
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChangePin(true)}
              className="p-2 bg-white rounded-full border"
            >
              <Key size={20} />
            </button>
            <button
              onClick={() => setRole(null)}
              className="p-2 bg-white rounded-full border"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <CentralBankControl
          rates={rates}
          onUpdateRates={(inf, bonus) =>
            updateDoc(
              doc(
                db,
                "artifacts",
                appId,
                "users",
                googleUser.uid,
                "settings",
                "rates"
              ),
              { inflation: inf, bonus }
            )
          }
          onToggleAuto={(auto) =>
            updateDoc(
              doc(
                db,
                "artifacts",
                appId,
                "users",
                googleUser.uid,
                "settings",
                "rates"
              ),
              { isAuto: auto }
            )
          }
        />
        <div className="grid grid-cols-2 gap-4 mt-8">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccount(acc)}
              className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center"
            >
              <div className="p-4 rounded-full mb-3 bg-blue-100 text-blue-600">
                {AVATARS[acc.icon] || <User />}
              </div>
              <span className="font-bold">{acc.name}</span>
            </button>
          ))}
          <button
            onClick={() => setShowCreateUser(true)}
            className="bg-slate-100 border-2 border-dashed p-6 rounded-2xl flex flex-col items-center justify-center text-slate-400"
          >
            <Plus size={32} />
            <span className="font-bold">新增</span>
          </button>
        </div>
        {showCreateUser && (
          <CreateUserModal
            onClose={() => setShowCreateUser(false)}
            onCreate={(name, icon, pin) =>
              addDoc(
                collection(
                  db,
                  "artifacts",
                  appId,
                  "users",
                  googleUser.uid,
                  "members"
                ),
                {
                  name,
                  icon,
                  pin,
                  createdAt: Date.now(),
                  lastInterestDate: Date.now(),
                }
              ).then(() => setShowCreateUser(false))
            }
          />
        )}
        {showChangePin && (
          <ChangePinModal
            onClose={() => setShowChangePin(false)}
            onUpdate={(pin) =>
              setDoc(
                doc(
                  db,
                  "artifacts",
                  appId,
                  "users",
                  googleUser.uid,
                  "settings",
                  "security"
                ),
                { pin },
                { merge: true }
              ).then(() => setShowChangePin(false))
            }
            currentPin={parentPin}
          />
        )}
      </div>
    );
  }

  const isParentView = role === "parent";
  const totalRate = rates.inflation + rates.bonus;
  const monthlyInterestProj = Math.floor((balance * totalRate) / 12);

  return (
    <div
      className={`min-h-screen pb-20 font-sans ${
        isParentView ? "bg-slate-50" : "bg-sky-50"
      }`}
    >
      <NewsTicker news={rates.news} />
      <header
        className={`p-6 rounded-b-3xl shadow-lg text-white ${
          isParentView ? "bg-slate-800" : "bg-blue-500"
        }`}
      >
        <div className="flex justify-between mb-4">
          <button
            onClick={() => {
              setSelectedAccount(null);
              if (!isParentView) setRole(null);
            }}
            className="flex items-center gap-1 bg-black/10 px-3 py-1 rounded-full text-sm"
          >
            <LogOut size={14} /> {isParentView ? "返回" : "登出"}
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
          <h2 className="text-5xl font-bold mt-1">{formatCurrency(balance)}</h2>
        </div>
      </header>
      <main className="p-5 space-y-4 max-w-lg mx-auto">
        <SavingsChart transactions={transactions} />
        <button
          onClick={() => setShowAiChat(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow-300" />{" "}
            <div className="text-left">
              <div className="font-bold">智慧小豬顧問</div>
              <div className="text-xs opacity-80">AI 理財助手</div>
            </div>
          </div>
          <MessageCircle />
        </button>
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
                className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl flex flex-col items-center font-bold"
              >
                <ArrowUpCircle size={24} /> 存入
              </button>
              <button
                onClick={() => {
                  setTransType("expense");
                  setIsTxModalOpen(true);
                }}
                className="bg-slate-100 text-slate-600 py-4 rounded-xl flex flex-col items-center font-bold"
              >
                <ArrowDownCircle size={24} /> 扣款 / 修正
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
                <div className="text-xs text-slate-400 mt-1">
                  年利率 {formatPercent(totalRate)}
                </div>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                <TrendingUp size={24} />
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
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex gap-2 font-bold text-slate-700">
            <History /> 交易紀錄
          </div>
          <div className="divide-y max-h-[300px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">無紀錄</div>
            ) : (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="p-4 flex justify-between items-center"
                >
                  <div className="flex gap-3 items-center">
                    <div
                      className={`p-2 rounded-full ${
                        t.type === "income"
                          ? "bg-blue-100 text-blue-600"
                          : t.type === "interest"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {t.type === "income" ? (
                        <ArrowUpCircle />
                      ) : t.type === "interest" ? (
                        <TrendingUp />
                      ) : (
                        <ArrowDownCircle />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{t.note}</div>
                      <div className="text-xs text-slate-400">
                        {formatDate(t.timestamp)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${
                      t.type === "expense"
                        ? "text-rose-500"
                        : "text-emerald-600"
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
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6">
              {transType === "income" ? "存入" : "取出"}
            </h3>
            <form onSubmit={handleTransaction} className="space-y-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full text-4xl font-bold border-b-2 outline-none"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="備註"
                className="w-full bg-slate-50 p-3 rounded-xl"
              />
              <button
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold"
              >
                確認
              </button>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="w-full py-3 text-slate-500 font-bold"
              >
                取消
              </button>
            </form>
          </div>
        </div>
      )}
      {showAiChat && (
        <SmartPiggyAI
          userRole={role}
          userName={selectedAccount.name}
          balance={balance}
          rates={rates}
          onClose={() => setShowAiChat(false)}
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
  );
}
