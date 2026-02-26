import React, { useState, useEffect, useMemo, useRef } from "react";
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
  UserCheck,
  AlertTriangle,
  Calculator,
  Award,
  Star,
  Crown,
  Loader2,
  Info,
  Trash2,
  Edit,
  Save, // v26 修復：補回被誤刪的圖示！
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
  deleteDoc,
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

// --- Constants ---
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

const THEMES = {
  ocean: {
    name: "海洋藍",
    bg: "bg-slate-50",
    header: "bg-blue-600",
    accent: "text-blue-600",
    card: "bg-white",
    chart: "#2563eb",
    gradient: "from-blue-500 to-cyan-400",
  },
  sunset: {
    name: "夕陽紅",
    bg: "bg-orange-50",
    header: "bg-orange-500",
    accent: "text-orange-600",
    card: "bg-white",
    chart: "#ea580c",
    gradient: "from-orange-500 to-pink-500",
  },
  forest: {
    name: "森林綠",
    bg: "bg-emerald-50",
    header: "bg-emerald-600",
    accent: "text-emerald-600",
    card: "bg-white",
    chart: "#059669",
    gradient: "from-emerald-500 to-teal-400",
  },
  space: {
    name: "星空紫",
    bg: "bg-slate-900",
    header: "bg-indigo-900",
    accent: "text-indigo-400",
    card: "bg-slate-800 text-white",
    chart: "#818cf8",
    gradient: "from-indigo-600 to-purple-600",
    isDark: true,
  },
};

// 擴充成就系統
const ACHIEVEMENTS = [
  {
    id: "first_save",
    name: "第一桶金",
    desc: "完成人生第一次存錢",
    icon: "🪙",
    condition: (bal, txs) => txs.some((t) => t.type === "income"),
  },
  {
    id: "saver_100",
    name: "百元大戶",
    desc: "存款餘額達到 $100",
    icon: "💵",
    condition: (bal) => bal >= 100,
  },
  {
    id: "saver_1000",
    name: "千元富翁",
    desc: "存款餘額達到 $1,000",
    icon: "💰",
    condition: (bal) => bal >= 1000,
  },
  {
    id: "saver_5000",
    name: "理財達人",
    desc: "存款餘額達到 $5,000",
    icon: "🏦",
    condition: (bal) => bal >= 5000,
  },
  {
    id: "saver_10000",
    name: "萬元大亨",
    desc: "存款餘額達到 $10,000",
    icon: "👑",
    condition: (bal) => bal >= 10000,
  },
  {
    id: "interest_1",
    name: "初嚐甜頭",
    desc: "獲得第 1 次複利收入",
    icon: "🌱",
    condition: (bal, txs) =>
      txs.filter((t) => t.type === "interest").length >= 1,
  },
  {
    id: "interest_10",
    name: "複利農夫",
    desc: "累積獲得 10 次複利收入",
    icon: "🌿",
    condition: (bal, txs) =>
      txs.filter((t) => t.type === "interest").length >= 10,
  },
  {
    id: "interest_30",
    name: "時間的朋友",
    desc: "累積獲得 30 次複利收入",
    icon: "🌳",
    condition: (bal, txs) =>
      txs.filter((t) => t.type === "interest").length >= 30,
  },
];

const AVATARS = {
  baby: <Baby size={32} />,
  cat: <Cat size={32} />,
  dog: <Dog size={32} />,
  rabbit: <Rabbit size={32} />,
  fish: <Fish size={32} />,
  bird: <Bird size={32} />,
  smile: <Smile size={32} />,
};

// --- Utility Functions ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
const formatCurrencyDisplay = (amount) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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
const withTimeout = (promise, ms = 10000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("連線逾時")), ms)
    ),
  ]);

// --- Components ---

const DeleteConfirmModal = ({ target, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 animate-in zoom-in-95">
    <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center">
      <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={32} className="text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">確定要刪除嗎？</h3>
      <p className="text-sm text-slate-500 mb-6">
        將會永久刪除{" "}
        <span className="font-bold text-red-500">{target?.name}</span>{" "}
        的資料，無法復原。
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
        >
          取消
        </button>
        <button
          onClick={() => onConfirm(target.id)}
          className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg"
        >
          確認刪除
        </button>
      </div>
    </div>
  </div>
);

const SavingsChart = ({ transactions, theme }) => {
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const sortedTxs = [...transactions].sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
    );
    let currentBal = 0;
    const points = [];
    sortedTxs.forEach((t) => {
      const val = parseFloat(t.amount) || 0;
      if (t.type === "income" || t.type === "interest") currentBal += val;
      else currentBal -= val;
      const ts = t.timestamp || Date.now();
      points.push({ date: ts, value: Math.max(0, currentBal) });
    });
    const validPoints = points.filter((p) => !isNaN(p.value) && !isNaN(p.date));
    return validPoints.slice(-30);
  }, [transactions]);

  if (data.length < 2) return null;

  const width = 400;
  const height = 150;
  const padding = 10;
  const maxVal = Math.max(...data.map((d) => d.value)) * 1.2 || 100;
  const minTime = data[0].date;
  const maxTime = data[data.length - 1].date;
  const timeRange = maxTime - minTime || 1;

  const getX = (time) => {
    const res =
      ((time - minTime) / timeRange) * (width - padding * 2) + padding;
    return isNaN(res) ? padding : res;
  };
  const getY = (val) => {
    const res = height - (val / maxVal) * (height - padding * 2) - padding;
    return isNaN(res) ? height - padding : res;
  };

  let d = `M ${getX(data[0].date)} ${getY(data[0].value)}`;
  for (let i = 0; i < data.length - 1; i++) {
    const x_mid = (getX(data[i].date) + getX(data[i + 1].date)) / 2;
    const y_mid = (getY(data[i].value) + getY(data[i + 1].value)) / 2;
    const cp_x1 = (x_mid + getX(data[i].date)) / 2;
    const cp_x2 = (x_mid + getX(data[i + 1].date)) / 2;
    d += ` Q ${cp_x1} ${getY(data[i].value)}, ${x_mid} ${y_mid} T ${getX(
      data[i + 1].date
    )} ${getY(data[i + 1].value)}`;
  }
  const areaD = `${d} L ${getX(data[data.length - 1].date)} ${height} L ${getX(
    data[0].date
  )} ${height} Z`;
  const chartColor = THEMES[theme]?.chart || "#2563eb";

  return (
    <div
      className={`${THEMES[theme]?.card} p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 overflow-hidden relative`}
    >
      <h3 className="font-bold mb-2 flex items-center gap-2 text-sm z-10 relative opacity-80">
        <TrendingUp size={16} /> 財富成長曲線
      </h3>
      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#chartGradient)" stroke="none" />
          <path
            d={d}
            fill="none"
            stroke={chartColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={getX(data[data.length - 1].date)}
            cy={getY(data[data.length - 1].value)}
            r="4"
            fill={chartColor}
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
};

// 複利計算機 Modal
const CompoundCalculator = ({ currentBalance, currentRate, onClose }) => {
  const [principal, setPrincipal] = useState(currentBalance || 1000);
  const [monthlyAdd, setMonthlyAdd] = useState(0);
  const [years, setYears] = useState(5);

  const calculateFutureValue = () => {
    const r = currentRate;
    const n = 12;
    const t = years;
    const PMT = monthlyAdd;
    const P = principal;
    const ratePerPeriod = r / n;
    const periods = n * t;

    if (ratePerPeriod === 0) return P + PMT * periods;

    const compoundFactor = Math.pow(1 + ratePerPeriod, periods);
    const futurePrincipal = P * compoundFactor;
    const futureContributions = PMT * ((compoundFactor - 1) / ratePerPeriod);

    return futurePrincipal + futureContributions;
  };

  const finalAmount = calculateFutureValue();
  const totalInvested = principal + monthlyAdd * 12 * years;
  const totalInterest = finalAmount - totalInvested;

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-blue-600">
            <Calculator size={24} /> 複利計算機
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          來算算看，如果持續存錢，未來會變成多少？
        </p>
        <div className="space-y-4 mb-6">
          <div>
            <label className="flex justify-between text-sm font-bold text-slate-600 mb-1">
              <span>目前本金</span>
              <span className="text-blue-600">${principal}</span>
            </label>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div>
            <label className="flex justify-between text-sm font-bold text-slate-600 mb-1">
              <span>每月再存入</span>
              <span className="text-emerald-600">${monthlyAdd}</span>
            </label>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={monthlyAdd}
              onChange={(e) => setMonthlyAdd(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
          <div>
            <label className="flex justify-between text-sm font-bold text-slate-600 mb-1">
              <span>投資年限 (年)</span>
              <span className="text-purple-600">{years} 年</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="text-center mb-4">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              {years} 年後的總資產
            </div>
            <div className="text-4xl font-bold text-slate-800">
              {formatCurrencyDisplay(finalAmount)}
            </div>
          </div>
          <div className="flex justify-between text-xs font-bold pt-3 border-t border-slate-200">
            <span className="text-slate-500">
              自己存的錢: <br />
              <span className="text-slate-700 text-sm">
                ${formatCurrencyDisplay(totalInvested)}
              </span>
            </span>
            <span className="text-emerald-600 text-right">
              利息賺的錢: <br />
              <span className="text-emerald-500 text-sm">
                +${formatCurrencyDisplay(totalInterest)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StickerGallery = ({ transactions, balance, theme }) => {
  const [selectedSticker, setSelectedSticker] = useState(null);
  const unlockedIds = useMemo(
    () =>
      ACHIEVEMENTS.filter((a) => a.condition(balance, transactions)).map(
        (a) => a.id
      ),
    [balance, transactions]
  );

  return (
    <div
      className={`${THEMES[theme]?.card} p-4 rounded-2xl shadow-sm border border-slate-100 mb-4`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold flex items-center gap-2 text-sm opacity-80">
          <Award size={16} /> 成就貼紙館
        </h3>
        <span className="text-xs font-bold opacity-60">
          {unlockedIds.length} / {ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = unlockedIds.includes(ach.id);
          return (
            <button
              key={ach.id}
              onClick={() => setSelectedSticker({ ...ach, isUnlocked })}
              className={`flex-shrink-0 flex flex-col items-center w-16 transition-transform active:scale-95 ${
                isUnlocked ? "opacity-100" : "opacity-40 grayscale"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mb-1 text-2xl shadow-sm ${
                  isUnlocked ? "bg-yellow-100" : "bg-slate-100"
                }`}
              >
                {ach.icon}
              </div>
              <span className="text-[10px] font-bold text-center leading-tight truncate w-full">
                {ach.name}
              </span>
            </button>
          );
        })}
      </div>

      {selectedSticker && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedSticker(null)}
        >
          <div
            className="bg-white w-full max-w-xs rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-24 h-24 text-5xl rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ${
                selectedSticker.isUnlocked
                  ? "bg-yellow-100"
                  : "bg-slate-100 grayscale"
              }`}
            >
              {selectedSticker.icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              {selectedSticker.name}
            </h3>
            <p className="text-slate-500 mb-4">{selectedSticker.desc}</p>
            <div
              className={`inline-block px-4 py-1 rounded-full text-xs font-bold ${
                selectedSticker.isUnlocked
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {selectedSticker.isUnlocked ? "✅ 已解鎖" : "🔒 未解鎖"}
            </div>
            <button
              onClick={() => setSelectedSticker(null)}
              className="w-full mt-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ThemeSelector = ({ current, onChange }) => (
  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
    {Object.entries(THEMES).map(([key, t]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border-2 transition-all ${
          current === key
            ? "border-blue-500 bg-white shadow-md"
            : "border-transparent bg-white/50 opacity-70"
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-gradient-to-br ${t.gradient}`}
        ></div>
        {t.name}
      </button>
    ))}
  </div>
);

const TransactionEditor = ({ tx, onClose, onSave, onDelete }) => {
  const [amount, setAmount] = useState(tx.amount);
  const [note, setNote] = useState(tx.note);
  const [isConfirming, setIsConfirming] = useState(false);
  if (isConfirming) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            刪除這筆紀錄？
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            金額: {tx.amount}, 備註: {tx.note}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsConfirming(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
            >
              返回
            </button>
            <button
              onClick={() => onDelete(tx.id)}
              className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg"
            >
              確認刪除
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">編輯交易</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500">金額</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 bg-slate-100 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">備註</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-slate-100 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-slate-500 font-bold"
            >
              取消
            </button>
            <button
              onClick={() => setIsConfirming(true)}
              className="flex-1 py-3 bg-red-100 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> 刪除
            </button>
            <button
              onClick={() => onSave(tx.id, parseFloat(amount), note)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Save size={16} /> 儲存
            </button>
          </div>
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
            if (newPin.length !== 4) return alert("須為4位數字");
            if (newPin !== confirmPin) return alert("密碼不一致");
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
const MemberFormModal = ({
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [pin, setPin] = useState(initialData?.pin || "");
  const [icon, setIcon] = useState(initialData?.icon || "smile");
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">
          {mode === "create" ? "新增成員" : "編輯成員"}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name && pin.length === 4) onSubmit(name, icon, pin);
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
            placeholder="4位數密碼 (PIN)"
            required
          />
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Object.keys(AVATARS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setIcon(k)}
                className={`p-3 rounded-xl flex-shrink-0 ${
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
              className="flex-1 py-3 text-slate-500 font-bold"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold"
            >
              {mode === "create" ? "建立" : "儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const CentralBankControl = ({
  rates,
  onUpdateRates,
  onToggleAuto,
  theme,
  onThemeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inflation, setInflation] = useState(rates.inflation * 100);
  const [bonus, setBonus] = useState(rates.bonus * 100);
  const t = THEMES[theme] || THEMES.ocean;
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-white p-4 rounded-2xl flex items-center justify-between shadow-lg bg-gradient-to-r ${t.gradient}`}
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
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            外觀主題
          </div>
          <ThemeSelector current={theme} onChange={onThemeChange} />
          <div className="border-t border-slate-100 my-4"></div>
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <Zap size={18} /> 自動調節通膨
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
const NewsTicker = ({ news }) => {
  // Safe default to prevent crash if news is somehow undefined
  const displayNews = news || "市場觀察中...";
  return (
    <div className="bg-slate-900 text-white text-xs py-2 px-4 overflow-hidden whitespace-nowrap">
      <div className="flex items-center gap-4 animate-in slide-in-from-right duration-1000">
        <span className="bg-red-500 px-1.5 rounded font-bold">BREAKING</span>
        {displayNews}
      </div>
    </div>
  );
};
const LoginScreen = ({ onLogin, onGuestLogin }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl text-center space-y-4">
      <div className="bg-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg">
        <PiggyBank size={48} className="text-white" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800">家庭銀行 v26.0</h1>
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

// --- Main Application ---
export default function FamilyBankApp() {
  const [googleUser, setGoogleUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [pinPadConfig, setPinPadConfig] = useState(null);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const [transactions, setTransactions] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [rates, setRates] = useState({
    inflation: 0.03,
    bonus: 0,
    isAuto: true,
    news: "市場觀察中...",
    lastUpdate: 0,
  });
  const [parentPin, setParentPin] = useState("8888");
  const [appTheme, setAppTheme] = useState("ocean");

  const [modalConfig, setModalConfig] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [transType, setTransType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txFilter, setTxFilter] = useState("all");

  const [interestFeedback, setInterestFeedback] = useState(null);

  // v26: 防護鎖，防止 React 渲染與 Firebase Snapshot 時間差導致的重複發息
  const isProcessingInterest = useRef(false);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId),
    [accounts, selectedAccountId]
  );
  const currentThemeData = THEMES[appTheme] || THEMES.ocean;

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setGoogleUser(u);
      setAuthReady(true);
      if (!u) {
        setRole(null);
        setSelectedAccountId(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!googleUser) return;
    const unsubAcc = onSnapshot(
      collection(db, "artifacts", appId, "users", googleUser.uid, "members"),
      (s) => {
        const data = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setAccounts(data);
      }
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
        const needsUpdate =
          Date.now() - (d.lastUpdate || 0) > 86400000 ||
          d.news === "市場觀察中...";
        if (d.isAuto && needsUpdate) updateMarketConditions(d.inflation);
      } else
        setDoc(ratesRef, {
          inflation: 0.025,
          bonus: 0,
          isAuto: true,
          news: "市場觀察中...",
          lastUpdate: 0,
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
    const unsubUi = onSnapshot(
      doc(db, "artifacts", appId, "users", googleUser.uid, "settings", "ui"),
      (s) => {
        if (s.exists()) setAppTheme(s.data().theme || "ocean");
      }
    );
    return () => {
      unsubAcc();
      unsubRates();
      unsubSec();
      unsubUi();
    };
  }, [googleUser]);

  const updateMarketConditions = async (current) => {
    if (!googleUser) return;
    const drift = (Math.random() - 0.5) * 0.03;
    let newCPI = Math.max(0.005, Math.min(0.08, current + drift));
    const today = new Date().toLocaleDateString("zh-TW");
    const item =
      MARKET_NEWS.find((n) => newCPI * 100 >= n.min && newCPI * 100 < n.max) ||
      MARKET_NEWS[0];
    await updateDoc(
      doc(db, "artifacts", appId, "users", googleUser.uid, "settings", "rates"),
      {
        inflation: newCPI,
        news: `${today} 財經快訊：今日 CPI ${(newCPI * 100).toFixed(1)}%。${
          item.text
        }`,
        lastUpdate: Date.now(),
      }
    );
  };

  useEffect(() => {
    if (!googleUser || !selectedAccountId) {
      setTransactions(null);
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
          .filter((t) => t.memberId === selectedAccountId)
          .sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(txs);
      }
    );
  }, [googleUser, selectedAccountId]);

  useEffect(() => {
    if (transactions) {
      const bal = transactions.reduce(
        (acc, t) =>
          t.type === "income" || t.type === "interest"
            ? acc + parseFloat(t.amount)
            : acc - parseFloat(t.amount),
        0
      );
      setBalance(bal);
    }
  }, [transactions]);

  // v26: 加入 useRef 鎖的穩健利息結算機制
  useEffect(() => {
    if (
      !selectedAccount ||
      !googleUser ||
      !selectedAccount.lastInterestDate ||
      transactions === null
    )
      return;

    const currentBal = transactions.reduce(
      (acc, t) =>
        t.type === "income" || t.type === "interest"
          ? acc + parseFloat(t.amount)
          : acc - parseFloat(t.amount),
      0
    );

    const checkInterest = async () => {
      const last = selectedAccount.lastInterestDate;
      const now = Date.now();
      const days = Math.floor((now - last) / 86400000);
      const rate = rates.inflation + rates.bonus;

      // 如果相差超過 1 天，且當下沒有正在處理利息
      if (days >= 1 && !isProcessingInterest.current) {
        isProcessingInterest.current = true; // 上鎖

        try {
          const memRef = doc(
            db,
            "artifacts",
            appId,
            "users",
            googleUser.uid,
            "members",
            selectedAccount.id
          );
          // 立即更新資料庫中的時間，防止其他客戶端重複執行
          await updateDoc(memRef, { lastInterestDate: now });

          if (currentBal > 0) {
            const dailyRate = rate / 365;
            const rawEarned = currentBal * (Math.pow(1 + dailyRate, days) - 1);
            const earned = Math.round(rawEarned * 100) / 100;

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
                  note: `系統結算複利 (${(rate * 100).toFixed(
                    1
                  )}%, 累積 ${days} 天)`,
                  timestamp: now,
                  memberId: selectedAccount.id,
                  by: "system",
                }
              );

              setInterestFeedback({ amount: earned, days: days });
              setTimeout(() => setInterestFeedback(null), 5000);
            }
          }
        } catch (error) {
          console.error("Interest calculation failed", error);
        } finally {
          // 等待一段時間讓 Firebase 的 Snapshot 確定更新後，再解開鎖
          setTimeout(() => {
            isProcessingInterest.current = false;
          }, 2000);
        }
      }
    };
    checkInterest();
  }, [selectedAccount, rates, googleUser, transactions]);

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
    const num = parseFloat(amount);
    if (num <= 0) {
      alert("金額必須大於 0");
      return;
    }
    if (transType === "expense" && num > balance) {
      alert("餘額不足！無法取出比存款還多的錢。");
      return;
    }

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

  const confirmDeleteMember = async (id) => {
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "users", googleUser.uid, "members", id)
      );
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      alert("刪除失敗");
    }
  };

  const handleMemberSubmit = async (name, icon, pin) => {
    try {
      if (modalConfig.type === "create") {
        await addDoc(
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
        );
      } else {
        await updateDoc(
          doc(
            db,
            "artifacts",
            appId,
            "users",
            googleUser.uid,
            "members",
            modalConfig.data.id
          ),
          { name, icon, pin }
        );
      }
      setModalConfig(null);
    } catch (e) {
      console.error(e);
      alert("操作失敗");
    }
  };

  const handleThemeChange = async (newTheme) => {
    setAppTheme(newTheme);
    if (googleUser)
      await setDoc(
        doc(db, "artifacts", appId, "users", googleUser.uid, "settings", "ui"),
        { theme: newTheme },
        { merge: true }
      );
  };

  const handleEditTx = async (id, newAmount, newNote) => {
    try {
      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          googleUser.uid,
          "transactions",
          id
        ),
        { amount: newAmount, note: newNote }
      );
      setEditingTx(null);
    } catch (e) {
      alert("更新失敗");
    }
  };
  const handleDeleteTx = async (id) => {
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "users", googleUser.uid, "transactions", id)
      );
      setEditingTx(null);
    } catch (e) {
      alert("刪除失敗");
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
      <div
        className={`min-h-screen pb-10 ${currentThemeData.bg} flex flex-col`}
      >
        <NewsTicker news={rates.news} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center space-y-6">
            <div className="flex justify-end">
              <button onClick={() => signOut(auth)}>
                <LogOut size={20} className="text-slate-300" />
              </button>
            </div>
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg text-white ${currentThemeData.header}`}
            >
              <PiggyBank size={48} />
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
              className={`w-full p-4 text-white rounded-2xl font-bold flex justify-center gap-2 ${currentThemeData.header}`}
            >
              <ShieldCheck /> 家長管理
            </button>
            <div className="grid grid-cols-2 gap-3">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    if (role === "parent") setSelectedAccountId(acc.id);
                    else
                      setPinPadConfig({
                        targetPin: acc.pin || "0000",
                        title: acc.name,
                        subTitle: "輸入 PIN",
                        onSuccess: () => {
                          setRole("child");
                          setSelectedAccountId(acc.id);
                          setPinPadConfig(null);
                        },
                      });
                  }}
                  className={`bg-white border-2 p-4 rounded-2xl hover:border-blue-300 flex flex-col items-center`}
                >
                  <div
                    className={`p-2 rounded-full mb-2 bg-slate-100 ${currentThemeData.accent}`}
                  >
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
        <div className="py-6 text-center">
          <p className="text-xs text-slate-400 font-medium opacity-60">
            王維與 Gemini 合作開發
          </p>
        </div>
        {pinPadConfig && (
          <PinPad {...pinPadConfig} onCancel={() => setPinPadConfig(null)} />
        )}
      </div>
    );
  }

  if (role === "parent" && !selectedAccount) {
    return (
      <div className={`min-h-screen p-6 ${currentThemeData.bg}`}>
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
          theme={appTheme}
          onThemeChange={handleThemeChange}
        />
        <div className="grid grid-cols-2 gap-4 mt-8">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center relative group"
            >
              <div className="absolute top-2 right-2 flex gap-1 opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalConfig({ type: "edit", data: acc });
                  }}
                  className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-blue-100 hover:text-blue-600"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(acc);
                  }}
                  className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <button
                onClick={() => setSelectedAccountId(acc.id)}
                className="flex flex-col items-center w-full mt-2"
              >
                <div
                  className={`p-4 rounded-full mb-3 bg-slate-100 ${currentThemeData.accent}`}
                >
                  {AVATARS[acc.icon] || <User />}
                </div>
                <span className="font-bold">{acc.name}</span>
              </button>
            </div>
          ))}
          <button
            onClick={() => setModalConfig({ type: "create" })}
            className="bg-slate-100 border-2 border-dashed p-6 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-200"
          >
            <Plus size={32} />
            <span className="font-bold">新增</span>
          </button>
        </div>
        {modalConfig && (
          <MemberFormModal
            onClose={() => setModalConfig(null)}
            onSubmit={handleMemberSubmit}
            initialData={modalConfig.data}
            mode={modalConfig.type}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            target={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={confirmDeleteMember}
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

  if (transactions === null) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${currentThemeData.bg}`}
      >
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pb-20 font-sans relative ${currentThemeData.bg}`}
    >
      {interestFeedback && (
        <div className="absolute top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 fade-in">
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">系統結算成功！</p>
              <p className="text-xs text-emerald-100">
                為您補發過去 {interestFeedback.days} 天的利息 +
                {formatCurrencyDisplay(interestFeedback.amount)}
              </p>
            </div>
          </div>
        </div>
      )}

      <NewsTicker news={rates.news} />
      <header
        className={`p-6 rounded-b-3xl shadow-lg text-white transition-colors duration-500 ${currentThemeData.header}`}
      >
        <div className="flex justify-between mb-4">
          <button
            onClick={() => {
              setSelectedAccountId(null);
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
          <h2 className="text-5xl font-bold mt-1">
            {formatCurrencyDisplay(balance)}
          </h2>
        </div>
      </header>
      <main className="p-5 space-y-4 max-w-lg mx-auto">
        <SavingsChart transactions={transactions} theme={appTheme} />
        {!isParentView && (
          <StickerGallery
            transactions={transactions}
            balance={balance}
            theme={appTheme}
          />
        )}

        <button
          onClick={() => setShowCalculator(true)}
          className={`w-full p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 bg-white transition-all active:scale-95 group`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${currentThemeData.accent} bg-slate-50`}
            >
              <Calculator size={20} />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-700">打開複利計算機</div>
              <div className="text-xs text-slate-400">
                算算看未來的錢會變多少？
              </div>
            </div>
          </div>
        </button>

        {isParentView ? (
          <div
            className={`${currentThemeData.card} p-4 rounded-2xl shadow-sm border border-slate-200`}
          >
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
            <div
              className={`${currentThemeData.card} p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between`}
            >
              <div>
                <div className="text-xs opacity-60 font-bold uppercase mb-1 flex items-center gap-1">
                  下個月預計利息 <Info size={12} className="opacity-50" />
                </div>
                <div
                  className={`text-2xl font-bold ${currentThemeData.accent}`}
                >
                  +{formatCurrencyDisplay(monthlyInterestProj)}
                </div>
                <div className="text-xs opacity-50 mt-1">
                  年利率 {formatPercent(totalRate)}
                </div>
              </div>
              <div
                className={`p-3 rounded-full bg-slate-100 ${currentThemeData.accent}`}
              >
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

        <div
          className={`${currentThemeData.card} rounded-2xl shadow-sm border overflow-hidden`}
        >
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex gap-2 font-bold opacity-80">
              <History /> 交易紀錄
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {["all", "income", "expense", "interest"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTxFilter(type)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                    txFilter === type
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {type === "all"
                    ? "全部"
                    : type === "income"
                    ? "存入"
                    : type === "expense"
                    ? "支出"
                    : "利息"}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
            {transactions.filter((t) =>
              txFilter === "all" ? true : t.type === txFilter
            ).length === 0 ? (
              <div className="p-8 text-center text-slate-400">無紀錄</div>
            ) : (
              transactions
                .filter((t) =>
                  txFilter === "all" ? true : t.type === txFilter
                )
                .map((t) => (
                  <div
                    key={t.id}
                    className="p-4 flex justify-between items-center group"
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
                        <div className="font-bold text-sm flex items-center gap-2">
                          {t.note}{" "}
                          {isParentView && (
                            <button
                              onClick={() => setEditingTx(t)}
                              className="text-slate-300 hover:text-blue-500"
                            >
                              <Edit size={12} />
                            </button>
                          )}
                        </div>
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
                      {formatCurrencyDisplay(t.amount)}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </main>

      {showCalculator && (
        <CompoundCalculator
          currentBalance={balance}
          currentRate={totalRate}
          onClose={() => setShowCalculator(false)}
        />
      )}

      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6">
              {transType === "income" ? "存入" : "取出"}
            </h3>
            <form onSubmit={handleTransaction} className="space-y-4">
              <input
                type="number"
                min="0"
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

      {showChangePin && (
        <ChangePinModal
          onClose={() => setShowChangePin(false)}
          onUpdate={handleUpdateParentPin}
          currentPin={parentPin}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteMember}
        />
      )}
      {editingTx && (
        <TransactionEditor
          tx={editingTx}
          onClose={() => setEditingTx(null)}
          onSave={handleEditTx}
          onDelete={handleDeleteTx}
        />
      )}
    </div>
  );
}
