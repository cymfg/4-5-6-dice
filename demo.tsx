import React, { useState, useEffect, useRef } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

const DiceGame = () => {
  const [gameState, setGameState] = useState('betting'); 
  const [playerMoney, setPlayerMoney] = useState(100);
  const [bankerMoney, setBankerMoney] = useState(200);
  const [bet, setBet] = useState(10);
  const [bankerPoint, setBankerPoint] = useState(null);
  const [playerPoint, setPlayerPoint] = useState(null);
  const [currentRoll, setCurrentRoll] = useState([1, 1, 1]);
  const [rollHistory, setRollHistory] = useState([]);
  const [message, setMessage] = useState('Place your bet and roll!');
  const [isRolling, setIsRolling] = useState(false);
  const [diceBox, setDiceBox] = useState(null);
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

        // Load the dice-box library
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@3d-dice/dice-box@1.0.8/dist/dice-box.umd.js';
        script.onload = () => {
          console.log('DiceBox script loaded');
          setTimeout(setupDiceBox, 100); // Small delay to ensure DOM is ready
        };
        script.onerror = () => {
          console.log('Failed to load 3D dice, falling back to 2D');
          setUse3DDice(false);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.log('3D dice initialization failed, using 2D dice');
        setUse3DDice(false);
      }
    };

    const setupDiceBox = async () => {
      if (window.DiceBox && diceBoxRef.current && !diceBox) {
        try {
          const Box = new window.DiceBox(diceBoxRef.current, {
            assetPath: 'https://unpkg.com/@3d-dice/dice-box@1.0.8/dist/',
            scale: 8,
            gravity: 2,
            mass: 1,
            friction: 0.5,
            restitution: 0.5,
            linearDamping: 0.3,
            angularDamping: 0.3,
            settleTimeout: 3000,
            offscreen: false,
            theme: 'default',
            enableShadows: true,
            lightIntensity: 0.9
          });
          
          await Box.init();
          console.log('DiceBox initialized successfully');
          setDiceBox(Box);
          setDiceBoxReady(true);
        } catch (error) {
          console.log('DiceBox setup failed:', error);
          setUse3DDice(false);
        }
      }
    };

    if (use3DDice && !diceBox) {
      initDiceBox();
    }

    return () => {
      if (diceBox) {
        try {
          diceBox.clear();
        } catch (e) {
          console.log('Error clearing dice box:', e);
        }
      }
    };
  }, [use3DDice, diceBox]);

  const DiceIcon = ({ value }) => {
    const diceComponents = {
      1: Dice1, 2: Dice2, 3: Dice3, 4: Dice4, 5: Dice5, 6: Dice6
    };
    const DiceComponent = diceComponents[value];
    return <DiceComponent className="w-12 h-12 text-blue-600" />;
  };

  const rollDice = () => {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
  };

  const analyzeRoll = (dice) => {
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
    const counts = {};
    dice.forEach(die => counts[die] = (counts[die] || 0) + 1);
    
    const pairs = Object.keys(counts).filter(key => counts[key] === 2);
    const singles = Object.keys(counts).filter(key => counts[key] === 1);
    
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
        // Clear any previous dice
        await diceBox.clear();
        
        // Roll 3 dice with 3D animation
        const results = await diceBox.roll('3d6');
        console.log('3D dice results:', results);
        
        const finalRoll = results.map(die => die.value);
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
        console.log('3D dice roll failed:', error);
        setUse3DDice(false);
        setIsRolling(false);
        // Retry with 2D dice
        setTimeout(() => performRoll(), 100);
      }
    } else {
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
    }
  };

  const handleBankerResult = (result) => {
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

  const handlePlayerResult = (result) => {
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
      if (result.value > bankerPoint) {
        setMessage(`You rolled ${result.description} vs Banker's Point ${bankerPoint} - You win!`);
        setPlayerMoney(prev => prev + bet);
        setBankerMoney(prev => prev - bet);
        setGameState('gameOver');
      } else if (result.value < bankerPoint) {
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-green-800 text-white rounded-lg shadow-2xl">
      <h1 className="text-4xl font-bold text-center mb-6 text-yellow-300">4-5-6 Dice Game</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Area */}
        <div className="bg-green-700 p-6 rounded-lg">
          <div className="text-center mb-6">
            {/* 3D Dice Container */}
            {use3DDice && (
              <div className="mb-4">
                <div 
                  ref={diceBoxRef} 
                  className="w-full h-72 rounded-lg bg-gradient-to-b from-green-800 to-green-900 border-2 border-green-600 relative overflow-hidden"
                  style={{ minHeight: '300px' }}
                >
                  {!diceBoxReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                      Loading 3D Dice...
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  Current Roll: {currentRoll.join(' - ')}
                </div>
              </div>
            )}
            
            {/* 2D Dice Fallback */}
            {!use3DDice && (
              <div className="flex justify-center space-x-4 mb-4">
                {currentRoll.map((die, index) => (
                  <div key={index} className={`bg-white p-2 rounded-lg ${isRolling ? 'animate-pulse' : ''}`}>
                    <DiceIcon value={die} />
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-xl font-bold mb-4 text-yellow-200">{message}</div>
            
            <div className="flex justify-center space-x-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-300">Your Money</div>
                <div className="text-xl font-bold text-green-300">${playerMoney}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-300">Banker Money</div>
                <div className="text-xl font-bold text-red-300">${bankerMoney}</div>
              </div>
              {bankerPoint && (
                <div className="text-center">
                  <div className="text-sm text-gray-300">Banker's Point</div>
                  <div className="text-xl font-bold text-red-300">{bankerPoint}</div>
                </div>
              )}
              {playerPoint && (
                <div className="text-center">
                  <div className="text-sm text-gray-300">Your Point</div>
                  <div className="text-xl font-bold text-blue-300">{playerPoint}</div>
                </div>
              )}
            </div>
          </div>

          {gameState === 'betting' && (
            <div className="text-center mb-4">
              <div className="mb-2">
                <label className="block text-sm text-gray-300 mb-1">Bet Amount:</label>
                <input
                  type="number"
                  value={bet}
                  onChange={(e) => setBet(Math.max(1, Math.min(Math.min(playerMoney, bankerMoney), parseInt(e.target.value) || 1)))}
                  className="px-3 py-1 rounded text-black text-center w-20"
                  min="1"
                  max={Math.min(playerMoney, bankerMoney)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Max bet: ${Math.min(playerMoney, bankerMoney)}
              </div>
            </div>
          )}

          <div className="text-center">
            {use3DDice && diceBoxReady && (
              <div className="mb-2">
                <span className="px-3 py-1 bg-green-600 rounded text-sm font-bold">
                  🎲 3D Dice Mode
                </span>
              </div>
            )}
            {!use3DDice && (
              <div className="mb-2">
                <button
                  onClick={() => {
                    setUse3DDice(true);
                    setDiceBoxReady(false);
                  }}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-bold"
                >
                  Switch to 3D Dice
                </button>
              </div>
            )}
            {gameState === 'gameOver' ? (
              <button
                onClick={newGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-xl"
              >
                New Game
              </button>
            ) : gameState === 'betting' ? (
              <button
                onClick={startGame}
                disabled={isRolling}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-bold text-xl"
              >
                Start Game
              </button>
            ) : gameState === 'playerRoll' ? (
              <button
                onClick={performRoll}
                disabled={isRolling}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-bold text-xl"
              >
                Roll Dice
              </button>
            ) : (
              <div className="px-6 py-3 bg-gray-600 rounded-lg font-bold text-xl">
                Banker Rolling...
              </div>
            )}
          </div>
        </div>

        {/* Rules and History */}
        <div className="space-y-4">
          <div className="bg-green-700 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-yellow-300 mb-2">Quick Rules</h3>
            <div className="text-sm space-y-1">
              <div><span className="text-green-300">Auto Win:</span> 4-5-6, Point 6, Triples (for you)</div>
              <div><span className="text-red-300">Auto Lose:</span> 1-2-3, Point 1</div>
              <div><span className="text-blue-300">Points:</span> Higher point beats lower point</div>
              <div><span className="text-yellow-300">Banker:</span> Wins on triples they roll</div>
            </div>
          </div>

          {rollHistory.length > 0 && (
            <div className="bg-green-700 p-4 rounded-lg max-h-64 overflow-y-auto">
              <h3 className="text-lg font-bold text-yellow-300 mb-2">Roll History</h3>
              <div className="space-y-2 text-sm">
                {rollHistory.slice(-10).map((roll, index) => (
                  <div key={index} className="flex justify-between">
                    <span className={roll.player === 'Banker' ? 'text-red-300' : 'text-blue-300'}>
                      {roll.player}:
                    </span>
                    <span>{roll.dice.join('-')}</span>
                    <span className="text-gray-300">{roll.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiceGame;import React, { useState, useEffect, useRef } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

const DiceGame = () => {
  const [gameState, setGameState] = useState('betting'); 
  const [playerMoney, setPlayerMoney] = useState(100);
  const [bankerMoney, setBankerMoney] = useState(200);
  const [bet, setBet] = useState(10);
  const [bankerPoint, setBankerPoint] = useState(null);
  const [playerPoint, setPlayerPoint] = useState(null);
  const [currentRoll, setCurrentRoll] = useState([1, 1, 1]);
  const [rollHistory, setRollHistory] = useState([]);
  const [message, setMessage] = useState('Place your bet and roll!');
  const [isRolling, setIsRolling] = useState(false);
  const [diceBox, setDiceBox] = useState(null);
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

        // Load the dice-box library
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@3d-dice/dice-box@1.0.8/dist/dice-box.umd.js';
        script.onload = () => {
          console.log('DiceBox script loaded');
          setTimeout(setupDiceBox, 100); // Small delay to ensure DOM is ready
        };
        script.onerror = () => {
          console.log('Failed to load 3D dice, falling back to 2D');
          setUse3DDice(false);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.log('3D dice initialization failed, using 2D dice');
        setUse3DDice(false);
      }
    };

    const setupDiceBox = async () => {
      if (window.DiceBox && diceBoxRef.current && !diceBox) {
        try {
          const Box = new window.DiceBox(diceBoxRef.current, {
            assetPath: 'https://unpkg.com/@3d-dice/dice-box@1.0.8/dist/',
            scale: 8,
            gravity: 2,
            mass: 1,
            friction: 0.5,
            restitution: 0.5,
            linearDamping: 0.3,
            angularDamping: 0.3,
            settleTimeout: 3000,
            offscreen: false,
            theme: 'default',
            enableShadows: true,
            lightIntensity: 0.9
          });
          
          await Box.init();
          console.log('DiceBox initialized successfully');
          setDiceBox(Box);
          setDiceBoxReady(true);
        } catch (error) {
          console.log('DiceBox setup failed:', error);
          setUse3DDice(false);
        }
      }
    };

    if (use3DDice && !diceBox) {
      initDiceBox();
    }

    return () => {
      if (diceBox) {
        try {
          diceBox.clear();
        } catch (e) {
          console.log('Error clearing dice box:', e);
        }
      }
    };
  }, [use3DDice, diceBox]);

  const DiceIcon = ({ value }) => {
    const diceComponents = {
      1: Dice1, 2: Dice2, 3: Dice3, 4: Dice4, 5: Dice5, 6: Dice6
    };
    const DiceComponent = diceComponents[value];
    return <DiceComponent className="w-12 h-12 text-blue-600" />;
  };

  const rollDice = () => {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
  };

  const analyzeRoll = (dice) => {
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
    const counts = {};
    dice.forEach(die => counts[die] = (counts[die] || 0) + 1);
    
    const pairs = Object.keys(counts).filter(key => counts[key] === 2);
    const singles = Object.keys(counts).filter(key => counts[key] === 1);
    
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
        // Clear any previous dice
        await diceBox.clear();
        
        // Roll 3 dice with 3D animation
        const results = await diceBox.roll('3d6');
        console.log('3D dice results:', results);
        
        const finalRoll = results.map(die => die.value);
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
        console.log('3D dice roll failed:', error);
        setUse3DDice(false);
        setIsRolling(false);
        // Retry with 2D dice
        setTimeout(() => performRoll(), 100);
      }
    } else {
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
    }
  };

  const handleBankerResult = (result) => {
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

  const handlePlayerResult = (result) => {
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
      if (result.value > bankerPoint) {
        setMessage(`You rolled ${result.description} vs Banker's Point ${bankerPoint} - You win!`);
        setPlayerMoney(prev => prev + bet);
        setBankerMoney(prev => prev - bet);
        setGameState('gameOver');
      } else if (result.value < bankerPoint) {
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-green-800 text-white rounded-lg shadow-2xl">
      <h1 className="text-4xl font-bold text-center mb-6 text-yellow-300">4-5-6 Dice Game</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Area */}
        <div className="bg-green-700 p-6 rounded-lg">
          <div className="text-center mb-6">
            {/* 3D Dice Container */}
            {use3DDice && (
              <div className="mb-4">
                <div 
                  ref={diceBoxRef} 
                  className="w-full h-72 rounded-lg bg-gradient-to-b from-green-800 to-green-900 border-2 border-green-600 relative overflow-hidden"
                  style={{ minHeight: '300px' }}
                >
                  {!diceBoxReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                      Loading 3D Dice...
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  Current Roll: {currentRoll.join(' - ')}
                </div>
              </div>
            )}
            
            {/* 2D Dice Fallback */}
            {!use3DDice && (
              <div className="flex justify-center space-x-4 mb-4">
                {currentRoll.map((die, index) => (
                  <div key={index} className={`bg-white p-2 rounded-lg ${isRolling ? 'animate-pulse' : ''}`}>
                    <DiceIcon value={die} />
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-xl font-bold mb-4 text-yellow-200">{message}</div>
            
            <div className="flex justify-center space-x-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-300">Your Money</div>
                <div className="text-xl font-bold text-green-300">${playerMoney}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-300">Banker Money</div>
                <div className="text-xl font-bold text-red-300">${bankerMoney}</div>
              </div>
              {bankerPoint && (
                <div className="text-center">
                  <div className="text-sm text-gray-300">Banker's Point</div>
                  <div className="text-xl font-bold text-red-300">{bankerPoint}</div>
                </div>
              )}
              {playerPoint && (
                <div className="text-center">
                  <div className="text-sm text-gray-300">Your Point</div>
                  <div className="text-xl font-bold text-blue-300">{playerPoint}</div>
                </div>
              )}
            </div>
          </div>

          {gameState === 'betting' && (
            <div className="text-center mb-4">
              <div className="mb-2">
                <label className="block text-sm text-gray-300 mb-1">Bet Amount:</label>
                <input
                  type="number"
                  value={bet}
                  onChange={(e) => setBet(Math.max(1, Math.min(Math.min(playerMoney, bankerMoney), parseInt(e.target.value) || 1)))}
                  className="px-3 py-1 rounded text-black text-center w-20"
                  min="1"
                  max={Math.min(playerMoney, bankerMoney)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Max bet: ${Math.min(playerMoney, bankerMoney)}
              </div>
            </div>
          )}

          <div className="text-center">
            {use3DDice && diceBoxReady && (
              <div className="mb-2">
                <span className="px-3 py-1 bg-green-600 rounded text-sm font-bold">
                  🎲 3D Dice Mode
                </span>
              </div>
            )}
            {!use3DDice && (
              <div className="mb-2">
                <button
                  onClick={() => {
                    setUse3DDice(true);
                    setDiceBoxReady(false);
                  }}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-bold"
                >
                  Switch to 3D Dice
                </button>
              </div>
            )}
            {gameState === 'gameOver' ? (
              <button
                onClick={newGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-xl"
              >
                New Game
              </button>
            ) : gameState === 'betting' ? (
              <button
                onClick={startGame}
                disabled={isRolling}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-bold text-xl"
              >
                Start Game
              </button>
            ) : gameState === 'playerRoll' ? (
              <button
                onClick={performRoll}
                disabled={isRolling}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-bold text-xl"
              >
                Roll Dice
              </button>
            ) : (
              <div className="px-6 py-3 bg-gray-600 rounded-lg font-bold text-xl">
                Banker Rolling...
              </div>
            )}
          </div>
        </div>

        {/* Rules and History */}
        <div className="space-y-4">
          <div className="bg-green-700 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-yellow-300 mb-2">Quick Rules</h3>
            <div className="text-sm space-y-1">
              <div><span className="text-green-300">Auto Win:</span> 4-5-6, Point 6, Triples (for you)</div>
              <div><span className="text-red-300">Auto Lose:</span> 1-2-3, Point 1</div>
              <div><span className="text-blue-300">Points:</span> Higher point beats lower point</div>
              <div><span className="text-yellow-300">Banker:</span> Wins on triples they roll</div>
            </div>
          </div>

          {rollHistory.length > 0 && (
            <div className="bg-green-700 p-4 rounded-lg max-h-64 overflow-y-auto">
              <h3 className="text-lg font-bold text-yellow-300 mb-2">Roll History</h3>
              <div className="space-y-2 text-sm">
                {rollHistory.slice(-10).map((roll, index) => (
                  <div key={index} className="flex justify-between">
                    <span className={roll.player === 'Banker' ? 'text-red-300' : 'text-blue-300'}>
                      {roll.player}:
                    </span>
                    <span>{roll.dice.join('-')}</span>
                    <span className="text-gray-300">{roll.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiceGame;