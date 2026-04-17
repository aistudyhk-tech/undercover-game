import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Eye, EyeOff, Copy, Check, Home, LogIn, KeyRound, Smartphone } from 'lucide-react';

// ==========================================
// 加密/解密工具 (處理含有中文的 URL 參數)
// ==========================================
const encodeState = (obj) => {
  return btoa(encodeURIComponent(JSON.stringify(obj)));
};

const decodeState = (str) => {
  try {
    return JSON.parse(decodeURIComponent(atob(str)));
  } catch (e) {
    return null;
  }
};

export default function App() {
  const [view, setView] = useState('menu'); // 'menu', 'hostSetup', 'hostRoom', 'playerJoin', 'playerWord'
  const [error, setError] = useState('');

  // 遊戲設定 State (主持用)
  const [civilianWord, setCivilianWord] = useState('');
  const [undercoverWord, setUndercoverWord] = useState('');
  const [playerCount, setPlayerCount] = useState(4);
  const [undercoverCount, setUndercoverCount] = useState(1);
  
  // 房間與分享 State
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showRoles, setShowRoles] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  // 玩家 State
  const [inputPin, setInputPin] = useState('');
  const [myWord, setMyWord] = useState('');
  const [myPlayerId, setMyPlayerId] = useState(null);

  // ==========================================
  // 初始化：檢查網址中是否帶有遊戲資料
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    
    if (gameParam) {
      const data = decodeState(gameParam);
      if (data && data.p) {
        setCurrentRoom(data);
        setView('playerJoin'); // 有資料的話，直接跳到玩家輸入密碼畫面
      } else {
        setError('無效的遊戲連結！請確認連結是否完整。');
      }
    }
  }, []);

  // ==========================================
  // 主持人功能
  // ==========================================
  const handleCreateRoom = () => {
    if (!civilianWord || !undercoverWord) {
      setError('請輸入平民詞和臥底詞！');
      return;
    }
    if (undercoverCount >= playerCount) {
      setError('臥底人數必須少於總人數！');
      return;
    }

    setError('');

    // 分配角色
    let roles = Array(playerCount).fill('平民');
    for (let i = 0; i < undercoverCount; i++) {
      roles[i] = '臥底';
    }
    roles.sort(() => Math.random() - 0.5); // 打亂

    // 建立玩家資料
    const players = roles.map((role, index) => ({
      id: index + 1,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      role: role,
      word: role === '平民' ? civilianWord : undercoverWord,
    }));

    const roomData = { p: players };
    
    // 產生專屬連結
    const encoded = encodeState(roomData);
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?game=${encoded}`;
    
    setCurrentRoom(roomData);
    setShareLink(link);
    setView('hostRoom');
    setShowRoles(false);
  };

  const handleCopyLink = () => {
    // 使用傳統方法以確保在 iframe (如預覽環境) 中也能運作
    const textArea = document.createElement("textarea");
    textArea.value = shareLink;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗', err);
    }
    document.body.removeChild(textArea);
  };

  const endRoom = () => {
    setCurrentRoom(null);
    setShareLink('');
    // 清除網址參數
    window.history.replaceState({}, document.title, window.location.pathname);
    setView('menu');
  };

  // ==========================================
  // 玩家功能
  // ==========================================
  const handleJoinRoom = () => {
    if (!inputPin) {
      setError('請輸入你的專屬密碼！');
      return;
    }

    setError('');
    const player = currentRoom.p.find(p => p.pin === inputPin);

    if (player) {
      setMyWord(player.word);
      setMyPlayerId(player.id);
      setView('playerWord');
    } else {
      setError('密碼錯誤！請核對主持人發給你的密碼。');
    }
  };

  // ==========================================
  // UI 渲染元件
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8 selection:bg-indigo-500">
      <div className="max-w-md mx-auto relative">
        
        {/* 標題 */}
        <h1 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-sm flex items-center justify-center gap-2">
          <Users className="w-8 h-8 text-indigo-400" />
          誰是臥底 <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded-md ml-2">免伺服器版</span>
        </h1>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-6 text-center shadow-sm animate-pulse">
            {error}
          </div>
        )}

        {/* ================= 主選單 ================= */}
        {view === 'menu' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
              <h2 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2">
                 準備開始遊戲
              </h2>
              <button 
                onClick={() => { setError(''); setView('hostSetup'); }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl font-bold text-lg mb-4 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-6 h-6" /> 建立新房間 (主持)
              </button>

              <div className="bg-slate-900/50 p-4 rounded-xl text-center border border-slate-700/50">
                <p className="text-sm text-slate-400 mb-2">我是玩家？</p>
                <p className="text-xs text-slate-500">請點擊主持人分享的<strong className="text-indigo-400 mx-1">遊戲連結</strong>進入遊戲，無需在此輸入。</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= 主持人：設定房間 ================= */}
        {view === 'hostSetup' && (
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
            <button onClick={() => setView('menu')} className="text-slate-400 hover:text-white mb-6 flex items-center gap-1 text-sm transition-colors">
              <Home className="w-4 h-4" /> 返回
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-indigo-300">設定題目</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">平民詞語</label>
                <input 
                  type="text" 
                  value={civilianWord}
                  onChange={(e) => setCivilianWord(e.target.value)}
                  placeholder="例如：蘋果"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">臥底詞語</label>
                <input 
                  type="text" 
                  value={undercoverWord}
                  onChange={(e) => setUndercoverWord(e.target.value)}
                  placeholder="例如：梨子"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">總玩家人數 (最多8)</label>
                  <select 
                    value={playerCount}
                    onChange={(e) => setPlayerCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {[3,4,5,6,7,8].map(num => <option key={num} value={num}>{num} 人</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">臥底人數</label>
                  <select 
                    value={undercoverCount}
                    onChange={(e) => setUndercoverCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {[1,2,3].map(num => <option key={num} value={num}>{num} 人</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleCreateRoom}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-4 rounded-xl font-bold text-lg mt-4 transition-all shadow-lg active:scale-95"
              >
                產生遊戲連結
              </button>
            </div>
          </div>
        )}

        {/* ================= 主持人：房間儀表板 ================= */}
        {view === 'hostRoom' && currentRoom && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            
            {/* 分享區塊 */}
            <div className="bg-indigo-900/40 border border-indigo-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <p className="text-indigo-200 text-sm font-medium mb-3">1. 將連結分享給所有玩家：</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={shareLink} 
                  className="flex-1 bg-slate-900/80 border border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
                />
                <button 
                  onClick={handleCopyLink}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors min-w-[80px]"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 密碼列表區塊 */}
            <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
              <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-200">2. 告訴玩家他們的密碼：</h3>
                <button 
                  onClick={() => setShowRoles(!showRoles)}
                  className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-lg transition-colors text-slate-300"
                >
                  {showRoles ? <><EyeOff className="w-3 h-3"/> 隱藏身分</> : <><Eye className="w-3 h-3"/> 顯示身分</>}
                </button>
              </div>
              
              <div className="p-3 space-y-2">
                {currentRoom.p.map((player) => (
                  <div key={player.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-500/20 text-indigo-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {player.id}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 text-sm">玩家 {player.id}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <KeyRound className="w-3 h-3"/> 密碼: <span className="font-mono text-emerald-400 text-sm ml-1">{player.pin}</span>
                        </div>
                      </div>
                    </div>
                    
                    {showRoles && (
                      <div className={`px-2 py-1 rounded-md text-xs font-bold ${player.role === '臥底' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>
                        {player.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 單機傳遞遊玩模式 */}
            <div className="pt-2">
              <button 
                onClick={() => setView('playerJoin')}
                className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mb-3"
              >
                <Smartphone className="w-5 h-5"/> 或在此裝置上輪流查看
              </button>

              <button 
                onClick={endRoom}
                className="w-full bg-red-900/30 hover:bg-red-800/50 text-red-300 border border-red-900/50 p-3 rounded-xl text-sm transition-all"
              >
                結束遊戲 (返回首頁)
              </button>
            </div>
          </div>
        )}

        {/* ================= 玩家：加入房間 ================= */}
        {view === 'playerJoin' && currentRoom && (
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
            {/* 如果是單機遊玩，提供返回主持畫面的按鈕 */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <LogIn className="w-6 h-6" /> 領取身分
              </h2>
              {shareLink && (
                <button onClick={() => setView('hostRoom')} className="text-xs text-slate-400 hover:text-white bg-slate-700 px-2 py-1 rounded">
                  回主持畫面
                </button>
              )}
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">請輸入你的專屬密碼 (4碼)</label>
                <input 
                  type="tel" 
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="向主持人索取"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-2xl font-mono tracking-widest text-center"
                  maxLength={4}
                />
              </div>

              <button 
                onClick={handleJoinRoom}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-bold text-lg mt-4 transition-all shadow-lg active:scale-95"
              >
                查看我的詞語
              </button>
            </div>
          </div>
        )}

        {/* ================= 玩家：查看詞語 ================= */}
        {view === 'playerWord' && (
          <div className="space-y-6 animate-in zoom-in duration-300">
            <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center relative overflow-hidden">
              {/* 裝飾背景 */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
              
              <h2 className="text-slate-400 font-medium mb-2 relative z-10">你是 玩家 {myPlayerId}</h2>
              <p className="text-sm text-slate-500 mb-8 relative z-10">請確認旁邊沒有人偷看</p>
              
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 mb-8 relative z-10 shadow-inner">
                <p className="text-slate-400 text-sm mb-4">你的詞語是：</p>
                <div className="text-4xl md:text-5xl font-black text-white tracking-widest">
                  {myWord}
                </div>
              </div>
              
              <div className="text-xs text-yellow-500/80 bg-yellow-500/10 p-3 rounded-lg relative z-10 inline-block">
                ⚠️ 看完後請記住詞語，不要向其他人展示螢幕。
              </div>
            </div>

            <button 
              onClick={() => {
                setView('playerJoin');
                setInputPin('');
                setMyWord('');
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl font-bold transition-all shadow-md"
            >
              隱藏並返回 (換下一位)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}