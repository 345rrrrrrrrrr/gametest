import { useState, useEffect } from 'react';
import { useScore } from '../../../lib/stores/useScore';
import { motion, AnimatePresence } from 'framer-motion';

const ScoreDisplay = () => {
  const { score, multiplier, comboTimer, highScore } = useScore();
  const [animateScore, setAnimateScore] = useState(false);
  const [prevScore, setPrevScore] = useState(score);
  
  // Animate score when it changes
  useEffect(() => {
    if (score !== prevScore) {
      setAnimateScore(true);
      setTimeout(() => setAnimateScore(false), 500);
      setPrevScore(score);
    }
  }, [score, prevScore]);
  
  // Format score with commas for thousands
  const formatScore = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Calculate time remaining on combo timer as percentage
  const comboPercentage = comboTimer > 0 ? (comboTimer / 5) * 100 : 0;
  
  return (
    <div className="bg-gray-800 bg-opacity-75 p-3 rounded-lg text-center">
      <div className="flex flex-col items-center">
        {/* Score display with animation */}
        <motion.div
          animate={animateScore ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-white"
        >
          {formatScore(score)}
        </motion.div>
        
        {/* High score */}
        <div className="text-xs text-gray-400 mt-1">
          High Score: {formatScore(highScore)}
        </div>
        
        {/* Multiplier display */}
        {multiplier > 1 && (
          <div className="mt-2">
            <div className="flex items-center justify-center">
              <span className="text-xs text-gray-300 mr-1">Multiplier:</span>
              <motion.span
                key={multiplier}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-sm font-bold text-yellow-400"
              >
                x{multiplier.toFixed(1)}
              </motion.span>
            </div>
            
            {/* Combo timer progress bar */}
            {comboTimer > 0 && (
              <div className="w-full h-1 bg-gray-700 mt-1 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: `${comboPercentage}%` }}
                  animate={{ width: `${comboPercentage}%` }}
                  className="h-full bg-yellow-500"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Score popup animation for recently earned points */}
        <AnimatePresence>
          {score !== prevScore && (
            <motion.div
              key={`score-popup-${Date.now()}`}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -20, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute text-green-400 font-bold"
            >
              +{formatScore(score - prevScore)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScoreDisplay;
