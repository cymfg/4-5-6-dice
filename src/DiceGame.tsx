import { useState, useEffect, useRef } from 'react';

// TypeScript declarations for dice-box
declare global {
  interface Window {
    DiceBox?: any;
  }
}
/* type declarations moved to src/types/dice-box.d.ts */

import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

const DiceGame = () => {
  const [gameState, setGameState] = useState('betting'); 
  const [playerMoney, setPlayerMoney] = useState(100);
  const [bankerMoney, setBankerMoney] = useState(200);
  const [bet, setBet] = useState(10);
  const [bankerPoint, setBankerPoint] = useState(null);
  const [playerPoint, setPlayerPoint] = useState(null);
  const [currentRoll, setCurrentRoll] = useState([1, 1, 1]);
  const [rollHistory, setRollHistory] = useState<{ dice: number[]; result: string; player: string }[]>([]);
  const [message, setMessage] = useState('Place your bet and roll!');
  const [isRolling, setIsRolling] = useState(false);
  const [diceBox, setDiceBox] = useState<any>(null);
  const diceBoxRef = useRef(null);
  const [use3DDice, setUse3DDice] = useState(true);
  const [diceBoxReady, setDiceBoxReady] = useState(false);

  // Initialize 3D dice box
  useEffect(() => {
    const initDiceBox = async () => {
      try {
        // Check if script is already loaded
        if (window.DiceBox) {
          setupDiceBox();
          return;
        }

        // Use latest npm-installed dice-box
        try {
          const { default: DiceBox } = await import('@3d-dice/dice-box');
          window.DiceBox = DiceBox;
          setupDiceBox();
        } catch (err) {
          console.log('Failed to load 3D dice from npm, falling back to 2D', err);
          setUse3DDice(false);
        }
      } catch (error) {
        console.log('3D dice initialization failed, using 2D dice');
        setUse3DDice(false);
      }
    };
    
    // Function to resize canvas when container changes with proper pixel density
    const resizeDiceBox = () => {
      if (diceBox && diceBoxReady) {
        const container = document.querySelector('#dice-box-container') as HTMLElement;
        const canvas = container?.querySelector('canvas') as HTMLCanvasElement;
        
        if (container && canvas) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          const pixelRatio = window.devicePixelRatio || 1;
          
          // Set CSS size to fill container
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          
          // Set actual canvas resolution with device pixel ratio
          canvas.width = containerWidth * pixelRatio;
          canvas.height = containerHeight * pixelRatio;
          
          // Try to trigger resize on the dice box
          if (typeof diceBox.resize === 'function') {
            diceBox.resize();
          }
          
          // Update renderer with proper pixel ratio
          if (diceBox.renderer?.setSize) {
            diceBox.renderer.setSize(containerWidth, containerHeight, false);
            if (diceBox.renderer.setPixelRatio) {
              diceBox.renderer.setPixelRatio(pixelRatio);
            }
          }
        }
      }
    };
    
    // Set up resize observer for the container
    let resizeObserver: ResizeObserver;
    if (use3DDice && diceBoxRef.current) {
      resizeObserver = new ResizeObserver(resizeDiceBox);
      resizeObserver.observe(diceBoxRef.current);
    }

    const setupDiceBox = async () => {
      if (window.DiceBox && diceBoxRef.current && !diceBox) {
        try {
          console.log('Creating DiceBox instance...');
          
          // Correct initialization according to docs
          const Box = new window.DiceBox('#dice-box-container', {
            assetPath: '/assets/dice-box/',  // Correct path with trailing slash
            scale: 10,  // Much larger dice for better visibility
            gravity: 1,
            theme: 'default',
            throwForce: 3  // Reduce throw force for larger area
          });
          
          console.log('Initializing DiceBox...');
          await Box.init();
          console.log('DiceBox initialized successfully');
          
          // Ensure canvas fills the container after initialization with proper pixel density
          // Use a small delay to ensure CSS is applied
          setTimeout(() => {
            const container = document.querySelector('#dice-box-container') as HTMLElement;
            const canvas = container?.querySelector('canvas') as HTMLCanvasElement;
            
            if (container && canvas) {
              const containerWidth = container.clientWidth;
              const containerHeight = container.clientHeight;
              const pixelRatio = window.devicePixelRatio || 1;
              
              console.log('Container dimensions after CSS:', containerWidth, 'x', containerHeight);
              console.log('Container computed style height:', getComputedStyle(container).height);
              console.log('Device pixel ratio:', pixelRatio);
              
              // Set CSS size to fill container
              canvas.style.width = '100%';
              canvas.style.height = '100%';
              
              // Set actual canvas resolution with device pixel ratio for crisp rendering
              canvas.width = containerWidth * pixelRatio;
              canvas.height = containerHeight * pixelRatio;
              
              console.log('Canvas resolution set to:', canvas.width, 'x', canvas.height);
              
              // Force dice-box to resize with proper pixel ratio
              if (typeof Box.resize === 'function') {
                console.log('Calling Box.resize()');
                Box.resize();
              }
              
              // Update renderer size with pixel ratio
              if (Box.renderer?.setSize) {
                console.log('Setting renderer size');
                Box.renderer.setSize(containerWidth, containerHeight, false);
                if (Box.renderer.setPixelRatio) {
                  Box.renderer.setPixelRatio(pixelRatio);
                }
              }
            } else {
              console.error('Container or canvas not found!');
            }
          }, 100);
          
          // Set the dice box ready
          setDiceBox(Box);
          setDiceBoxReady(true);
          
          // Roll initial dice to test
          try {
            console.log('Rolling initial test dice...');
            const initialRoll = await Box.roll('3d6');
            console.log('Initial roll results:', initialRoll);
            
            // Extract dice values
            if (Array.isArray(initialRoll) && initialRoll.length === 3) {
              const values = initialRoll.map((die: any) => die.value || die);
              setCurrentRoll(values);
            } else {
              setCurrentRoll([1, 1, 1]);
            }
          } catch (err) {
            console.error('Initial roll failed:', err);
            setCurrentRoll([1, 1, 1]);
          }
          
        } catch (error) {
          console.error('DiceBox setup failed:', error);
          setUse3DDice(false);
        }
      }
    };

    if (use3DDice && !diceBox) {
      initDiceBox();
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (diceBox) {
        try {
          diceBox.clear();
        } catch (e) {
          console.log('Error clearing dice box:', e);
        }
      }
    };
  }, [use3DDice, diceBox]);

  const DiceIcon = ({ value }: { value: number }) => {
    const diceComponents = {
      1: Dice1, 2: Dice2, 3: Dice3, 4: Dice4, 5: Dice5, 6: Dice6
    };
    const DiceComponent = diceComponents[value as keyof typeof diceComponents];
    return <DiceComponent className="w-24 h-24 text-purple-600" />;
  };

  const rollDice = () => {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
  };

  const analyzeRoll = (dice: number[]) => {
    const sorted = [...dice].sort();
    
    // Check for 4-5-6
    if (sorted[0] === 4 && sorted[1] === 5 && sorted[2] === 6) {
      return { type: 'win', description: '4-5-6 - Auto Win!' };
    }
    
    // Check for 1-2-3
    if (sorted[0] === 1 && sorted[1] === 2 && sorted[2] === 3) {
      return { type: 'lose', description: '1-2-3 - Auto Lose!' };
    }
    
    // Check for triples
    if (dice[0] === dice[1] && dice[1] === dice[2]) {
      return { type: 'triple', value: dice[0], description: `Triple ${dice[0]}s!` };
    }
    
    // Check for points (pair + single)
    const counts: Record<number, number> = {};
    dice.forEach((die: number) => counts[die] = (counts[die] || 0) + 1);
    
    const pairs = Object.keys(counts).filter((key: string) => counts[parseInt(key)] === 2);
    const singles = Object.keys(counts).filter((key: string) => counts[parseInt(key)] === 1);
    
    if (pairs.length === 1 && singles.length === 1) {
      const point = parseInt(singles[0]);
      if (point === 6) {
        return { type: 'win', description: 'Point 6 - Auto Win!' };
      } else if (point === 1) {
        return { type: 'lose', description: 'Point 1 - Auto Lose!' };
      } else {
        return { type: 'point', value: point, description: `Point ${point}` };
      }
    }
    
    return { type: 'continue', description: 'Keep rolling...' };
  };

  // Banker auto-roll effect
  useEffect(() => {
    if (gameState === 'bankerRoll' && !isRolling) {
      const timer = setTimeout(() => {
        performRoll();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, isRolling]);

  const performRoll = async () => {
    setIsRolling(true);
    
    if (use3DDice && diceBox && diceBoxReady) {
      try {
        console.log('Rolling 3D dice...');
        
        // Clear previous dice
        if (typeof diceBox.clear === 'function') {
          diceBox.clear();
        }
        
        // Roll the dice using the simple API
        const results = await diceBox.roll('3d6');
        console.log('Dice roll results:', results);
        
        // Extract dice values
        let finalRoll = [1, 1, 1]; // Default fallback
        
        if (Array.isArray(results) && results.length === 3) {
          finalRoll = results.map((die: any) => {
            // The value should be in die.value according to docs
            return typeof die.value === 'number' ? die.value : die;
          });
          
          // Validate the values
          if (finalRoll.every(val => typeof val === 'number' && val >= 1 && val <= 6)) {
            console.log('Valid dice values:', finalRoll);
          } else {
            console.warn('Invalid dice values, using fallback:', finalRoll);
            finalRoll = rollDice();
          }
        } else {
          console.warn('Unexpected results format:', results);
          finalRoll = rollDice();
        }
        
        setCurrentRoll(finalRoll);
        setIsRolling(false);
        
        const result = analyzeRoll(finalRoll);
        const rollRecord = { 
          dice: [...finalRoll], 
          result: result.description, 
          player: gameState === 'bankerRoll' ? 'Banker' : 'Player' 
        };
        setRollHistory(prev => [...prev, rollRecord]);
        
        if (gameState === 'bankerRoll') {
          handleBankerResult(result);
        } else {
          handlePlayerResult(result);
        }
      } catch (error) {
        console.error('3D dice roll failed:', error);
        // Fall back to 2D for this roll
        setIsRolling(false);
        perform2DRoll();
      }
    } else {
      perform2DRoll();
    }
  };
  
  const perform2DRoll = () => {
    // Fallback to 2D animated dice
    let animationCount = 0;
    const maxAnimations = 8;
    
    const animate = () => {
      if (animationCount < maxAnimations) {
        setCurrentRoll(rollDice());
        animationCount++;
        setTimeout(animate, 100);
      } else {
        // Final roll
        const finalRoll = rollDice();
        setCurrentRoll(finalRoll);
        setIsRolling(false);
        
        const result = analyzeRoll(finalRoll);
        const rollRecord = { 
          dice: [...finalRoll], 
          result: result.description, 
          player: gameState === 'bankerRoll' ? 'Banker' : 'Player' 
        };
        setRollHistory(prev => [...prev, rollRecord]);
        
        if (gameState === 'bankerRoll') {
          handleBankerResult(result);
        } else {
          handlePlayerResult(result);
        }
      }
    };
    
    animate();
  };

  const handleBankerResult = (result: any) => {
    if (result.type === 'win') {
      setMessage(`Banker ${result.description} - Banker wins!`);
      setPlayerMoney(prev => prev - bet);
      setBankerMoney(prev => prev + bet);
      setGameState('gameOver');
    } else if (result.type === 'lose') {
      setMessage(`Banker ${result.description} - Player wins!`);
      setPlayerMoney(prev => prev + bet);
      setBankerMoney(prev => prev - bet);
      setGameState('gameOver');
    } else if (result.type === 'triple') {
      setMessage(`Banker rolled ${result.description} - Banker wins!`);
      setPlayerMoney(prev => prev - bet);
      setBankerMoney(prev => prev + bet);
      setGameState('gameOver');
    } else if (result.type === 'point') {
      setBankerPoint(result.value);
      setMessage(`Banker established ${result.description}. Your turn to roll!`);
      setGameState('playerRoll');
    } else {
      setMessage(`Banker rolled: ${result.description}`);
      // Banker will auto-roll again due to useEffect
    }
  };

  const handlePlayerResult = (result: any) => {
    if (result.type === 'win') {
      setMessage(`You rolled ${result.description} - You win!`);
      setPlayerMoney(prev => prev + bet);
      setBankerMoney(prev => prev - bet);
      setGameState('gameOver');
    } else if (result.type === 'lose') {
      setMessage(`You rolled ${result.description} - You lose!`);
      setPlayerMoney(prev => prev - bet);
      setBankerMoney(prev => prev + bet);
      setGameState('gameOver');
    } else if (result.type === 'triple') {
      setMessage(`You rolled ${result.description} - You win!`);
      setPlayerMoney(prev => prev + bet);
      setBankerMoney(prev => prev - bet);
      setGameState('gameOver');
    } else if (result.type === 'point') {
      setPlayerPoint(result.value);
      if (bankerPoint !== null && result.value > bankerPoint) {
        setMessage(`You rolled ${result.description} vs Banker's Point ${bankerPoint} - You win!`);
        setPlayerMoney(prev => prev + bet);
        setBankerMoney(prev => prev - bet);
        setGameState('gameOver');
      } else if (bankerPoint !== null && result.value < bankerPoint) {
        setMessage(`You rolled ${result.description} vs Banker's Point ${bankerPoint} - You lose!`);
        setPlayerMoney(prev => prev - bet);
        setBankerMoney(prev => prev + bet);
        setGameState('gameOver');
      } else {
        setMessage(`You rolled ${result.description} vs Banker's Point ${bankerPoint} - Push (tie)!`);
        setGameState('gameOver');
      }
    } else {
      setMessage(`You rolled: ${result.description}`);
    }
  };

  const startGame = () => {
    const maxBet = Math.min(playerMoney, bankerMoney);
    if (bet > maxBet) {
      setMessage(`Maximum bet is $${maxBet} (limited by available funds)`);
      return;
    }
    
    setGameState('bankerRoll');
    setBankerPoint(null);
    setPlayerPoint(null);
    setRollHistory([]);
    setMessage('Banker is rolling...');
  };

  const newGame = () => {
    setGameState('betting');
    setBankerPoint(null);
    setPlayerPoint(null);
    setRollHistory([]);
    setMessage('Place your bet and roll!');
  };

  // Modern UI with dice box as focal point
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center p-4 overflow-x-hidden">
      {/* Modern header with glow effect */}
      <div className="relative mb-4 flex-shrink-0">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-pulse">
          4-5-6 DICE
        </h1>
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-lg blur opacity-30"></div>
      </div>
      
      {/* Main Dice Box Container - Focal Point */}
      <div className="w-full max-w-6xl mb-4">
        {use3DDice && (
          <div className="relative">
            {/* Decorative frame around dice box */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-50"></div>
            <div 
              id="dice-box-container"
              ref={diceBoxRef} 
              className="relative w-full h-[45vh] sm:h-[50vh] md:h-[55vh] rounded-2xl bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border-2 border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.4)] overflow-hidden"
              style={{
                position: 'relative',
                width: '100%'
              }}>
              {!diceBoxReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-xl font-semibold text-purple-300 animate-pulse">Initializing 3D Dice...</p>
                </div>
              )}
            </div>
            {/* Current roll display */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-purple-500/50">
              <div className="text-lg font-bold text-purple-300">
                {currentRoll.join(' • ')}
              </div>
            </div>
            {/* Debug info */}
            {diceBoxReady && (
              <div className="absolute top-2 left-2 text-xs text-green-400 bg-black/60 px-2 py-1 rounded">
                3D Ready
              </div>
            )}
            {!diceBoxReady && use3DDice && (
              <div className="absolute top-2 left-2 text-xs text-yellow-400 bg-black/60 px-2 py-1 rounded">
                Loading...
              </div>
            )}
          </div>
        )}
        {!use3DDice && (
          <div className="relative p-16 rounded-2xl bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border-2 border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            <div className="flex justify-center items-center space-x-8">
              {currentRoll.map((die, index) => (
                <div 
                  key={index} 
                  className={`relative transform transition-all duration-300 ${isRolling ? 'animate-spin scale-110' : 'hover:scale-110'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-60"></div>
                  <div className="relative bg-gradient-to-br from-white to-gray-200 p-6 rounded-2xl shadow-2xl">
                    <DiceIcon value={die} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Message - Modern styled */}
      <div className="relative mb-3">
        <div className="px-8 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-md rounded-full border border-purple-500/30">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300 text-center">
            {message}
          </div>
        </div>
      </div>

      {/* Stats Cards - Modern glass morphism */}
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        <div className="px-6 py-3 bg-gradient-to-br from-green-900/30 to-green-700/30 backdrop-blur-md rounded-xl border border-green-500/30">
          <div className="text-xs uppercase tracking-wider text-green-300 mb-1">Your Bank</div>
          <div className="text-3xl font-black text-green-400">${playerMoney}</div>
        </div>
        <div className="px-6 py-3 bg-gradient-to-br from-red-900/30 to-red-700/30 backdrop-blur-md rounded-xl border border-red-500/30">
          <div className="text-xs uppercase tracking-wider text-red-300 mb-1">Banker</div>
          <div className="text-3xl font-black text-red-400">${bankerMoney}</div>
        </div>
        {bankerPoint && (
          <div className="px-6 py-3 bg-gradient-to-br from-orange-900/30 to-orange-700/30 backdrop-blur-md rounded-xl border border-orange-500/30">
            <div className="text-xs uppercase tracking-wider text-orange-300 mb-1">Banker Point</div>
            <div className="text-3xl font-black text-orange-400">{bankerPoint}</div>
          </div>
        )}
        {playerPoint && (
          <div className="px-6 py-3 bg-gradient-to-br from-blue-900/30 to-blue-700/30 backdrop-blur-md rounded-xl border border-blue-500/30">
            <div className="text-xs uppercase tracking-wider text-blue-300 mb-1">Your Point</div>
            <div className="text-3xl font-black text-blue-400">{playerPoint}</div>
          </div>
        )}
      </div>

      {/* Betting Controls - Modern */}
      {gameState === 'betting' && (
        <div className="mb-4">
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-purple-500/30">
            <label className="block text-sm font-semibold text-purple-300 mb-2 uppercase tracking-wider">Place Your Bet</label>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => setBet(Math.max(1, bet - 10))}
                className="px-3 py-2 bg-purple-600/50 hover:bg-purple-600/70 rounded-lg font-bold transition-all"
              >
                -10
              </button>
              <input
                type="number"
                value={bet}
                onChange={(e) => setBet(Math.max(1, Math.min(Math.min(playerMoney, bankerMoney), parseInt(e.target.value) || 1)))}
                className="px-4 py-2 bg-black/50 border border-purple-500/50 rounded-lg text-center text-2xl font-bold w-24 focus:outline-none focus:border-purple-400"
                min="1"
                max={Math.min(playerMoney, bankerMoney)}
              />
              <button 
                onClick={() => setBet(Math.min(Math.min(playerMoney, bankerMoney), bet + 10))}
                className="px-3 py-2 bg-purple-600/50 hover:bg-purple-600/70 rounded-lg font-bold transition-all"
              >
                +10
              </button>
            </div>
            <div className="text-xs text-purple-400 mt-2 text-center">
              Maximum: ${Math.min(playerMoney, bankerMoney)}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Modern styled */}
      <div className="flex flex-col items-center gap-3 mb-4">
        {/* Dice Mode Toggle */}
        <div className="flex items-center gap-2">
          {use3DDice && diceBoxReady && (
            <span className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full text-sm font-bold flex items-center gap-2">
              <span className="animate-pulse">●</span> 3D Mode Active
            </span>
          )}
          {!use3DDice && (
            <button
              onClick={() => {
                setUse3DDice(true);
                setDiceBoxReady(false);
              }}
              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-full text-sm font-bold transition-all transform hover:scale-105"
            >
              Enable 3D Dice
            </button>
          )}
        </div>
        
        {/* Main Action Button */}
        {gameState === 'gameOver' ? (
          <button
            onClick={newGame}
            className="relative group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-black text-2xl uppercase tracking-wider transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(147,51,234,0.5)]"
          >
            <span className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"></span>
            New Game
          </button>
        ) : gameState === 'betting' ? (
          <button
            onClick={startGame}
            disabled={isRolling}
            className="relative group px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-black text-2xl uppercase tracking-wider transition-all transform hover:scale-105 disabled:scale-100 shadow-[0_0_30px_rgba(239,68,68,0.5)] disabled:shadow-none"
          >
            <span className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"></span>
            Start Game
          </button>
        ) : gameState === 'playerRoll' ? (
          <button
            onClick={performRoll}
            disabled={isRolling}
            className="relative group px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-black text-2xl uppercase tracking-wider transition-all transform hover:scale-105 disabled:scale-100 shadow-[0_0_30px_rgba(239,68,68,0.5)] disabled:shadow-none animate-pulse"
          >
            <span className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"></span>
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        ) : (
          <div className="px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl font-black text-2xl uppercase tracking-wider animate-pulse">
            Banker Rolling...
          </div>
        )}
      </div>

      {/* Bottom Info Section - Modern Cards */}
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-4">
        {/* Rules Card */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-4">GAME RULES</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500/20 rounded text-green-400 font-semibold">WIN</span>
              <span className="text-gray-300">4-5-6, Point 6, Triples (You)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-500/20 rounded text-red-400 font-semibold">LOSE</span>
              <span className="text-gray-300">1-2-3, Point 1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-500/20 rounded text-blue-400 font-semibold">POINTS</span>
              <span className="text-gray-300">Higher beats lower</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-500/20 rounded text-orange-400 font-semibold">BANKER</span>
              <span className="text-gray-300">Wins on their triples</span>
            </div>
          </div>
        </div>

        {/* History Card */}
        {rollHistory.length > 0 && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">RECENT ROLLS</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
              {rollHistory.slice(-5).reverse().map((roll, index) => (
                <div key={index} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
                  <span className={`font-bold ${roll.player === 'Banker' ? 'text-red-400' : 'text-blue-400'}`}>
                    {roll.player}
                  </span>
                  <span className="text-purple-300 font-mono">{roll.dice.join(' • ')}</span>
                  <span className="text-xs text-gray-400">{roll.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceGame;