'use client'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import wordsData from './data/words.json';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/utils/firestore';

export default function Home() {
  const [word, setWord] = useState('');
  const [activeWord, setActiveWord] = useState('');
  const [grid, setGrid] = useState([]);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [foundLetters, setFoundLetters] = useState([]);
  const [currentWords, setCurrentWords] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [levelAttempts, setLevelAttempts] = useState({});

  // Rastgele 3 kelime seç
  const getRandomWords = () => {
    const allWords = wordsData.words;
    const selectedWords = [];
    const usedIndexes = new Set();

    while (selectedWords.length < 3) {
      const randomIndex = Math.floor(Math.random() * allWords.length);
      if (!usedIndexes.has(randomIndex)) {
        selectedWords.push(allWords[randomIndex]);
        usedIndexes.add(randomIndex);
      }
    }
    return selectedWords;
  };

  // Liderlik tablosunu getir
  const fetchLeaderboard = async () => {
    const q = query(collection(db, "scores"), orderBy("totalAttempts", "asc"));
    const querySnapshot = await getDocs(q);
    const scores = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setLeaderboard(scores);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Oyunu sıfırla
  const resetGame = () => {
    setCurrentLevel(1);
    setTotalAttempts(0);
    setAttempts(0);
    setFoundLetters([]);
    setWord('');
    setActiveWord('');
    setPlayerName('');
    const newWords = getRandomWords();
    setCurrentWords(newWords);
    initializeGrid(newWords);
  };

  // Skoru kaydet
  const saveScore = async () => {
    if (!playerName.trim()) {
      toast.error("Lütfen isminizi girin!");
      return;
    }

    try {
      await addDoc(collection(db, "scores"), {
        playerName: playerName.trim(),
        totalAttempts,
        levelAttempts: { ...levelAttempts, [currentLevel]: attempts },
        timestamp: new Date()
      });

      toast.success("Skorunuz kaydedildi!");
      await fetchLeaderboard();
      setShowFinalDialog(false);
      resetGame();
    } catch (error) {
      toast.error("Bir hata oluştu!");
    }
  };

  // Yeni bölüm başlat
  const startNewLevel = () => {
    setLevelAttempts(prev => ({
      ...prev,
      [currentLevel]: attempts
    }));

    if (currentLevel === 5) {
      const totalAttemptsSum = Object.values(levelAttempts).reduce((sum, attempts) => sum + attempts, 0) + attempts;
      setTotalAttempts(totalAttemptsSum);
      setShowFinalDialog(true);
      return;
    }

    const newWords = getRandomWords();
    setCurrentWords(newWords);
    setFoundLetters([]);
    setWord('');
    setActiveWord('');
    setShowDialog(false);
    initializeGrid(newWords);
    setCurrentLevel(prev => prev + 1);
    setAttempts(0);
  };

  // Grid'i başlat
  const initializeGrid = (words) => {
    const newGrid = Array(8).fill().map(() => Array(16).fill(''));
    const positions = [];

    // En uzun kelimeyi bul
    const maxWordLength = Math.max(...words.map(word => word.length));

    // Güvenli başlangıç pozisyonları
    const startRow = Math.floor(Math.random() * (8 - maxWordLength));
    const startCol = Math.floor(Math.random() * (16 - maxWordLength));

    // İlk kelimeyi yatay yerleştir
    words[0].split('').forEach((letter, index) => {
      newGrid[startRow][startCol + index] = letter;
      positions.push({ row: startRow, col: startCol + index, letter });
    });

    // İkinci kelimeyi dikey yerleştir
    if (startRow + words[1].length <= 8) {
      words[1].split('').forEach((letter, index) => {
        newGrid[startRow + index][startCol] = letter;
        if (index > 0) {
          positions.push({ row: startRow + index, col: startCol, letter });
        }
      });
    }

    // Üçüncü kelimeyi dikey yerleştir
    const thirdWordStartCol = startCol + 2;
    if (startRow + words[2].length <= 8) {
      words[2].split('').forEach((letter, index) => {
        newGrid[startRow + index][thirdWordStartCol] = letter;
        positions.push({ row: startRow + index, col: thirdWordStartCol, letter });
      });
    }

    setGrid(newGrid);
    setSelectedPositions(positions);
  };

  // İlk yükleme
  useEffect(() => {
    resetGame();
  }, []);

  // Tüm harflerin bulunup bulunmadığını kontrol et
  const checkAllLettersFound = (newFoundLetters) => {
    const allUniqueLetters = [...new Set(currentWords.join(''))];
    return allUniqueLetters.every(letter => newFoundLetters.includes(letter));
  };

  // Harfi kontrol et
  const checkLetter = () => {
    if (!word) return;

    const inputLetter = word.toUpperCase();
    setActiveWord(inputLetter);
    setAttempts(prev => prev + 1);

    const allLetters = currentWords.join('').split('');
    const occurrences = allLetters.filter(letter => letter === inputLetter).length;

    if (occurrences > 0) {
      toast.success(`"${inputLetter}" harfi ${occurrences} kez bulundu!`);
      const newFoundLetters = [...foundLetters, inputLetter];
      setFoundLetters(newFoundLetters);

      // Tüm harfler bulundu mu hemen kontrol et
      if (checkAllLettersFound(newFoundLetters)) {
        setTotalAttempts(prev => prev + attempts);
        setShowDialog(true);
      }
    } else {
      toast.error(`"${inputLetter}" harfi bulunamadı!`);
    }
    setWord('');
  };

  // useEffect ile foundLetters değiştiğinde kontrol et
  useEffect(() => {
    if (foundLetters.length > 0 && checkAllLettersFound(foundLetters)) {
      setShowDialog(true);
    }
  }, [foundLetters]);

  return (
    <div className='flex flex-col items-center p-5 h-screen'>
      <Toaster position="top-center" />
      <div className='flex flex-col items-center gap-2'>
        <p className='text-4xl font-bold'>Quizzers</p>
        <p className='text-sm font-bold text-gray-300 cursor-pointer' onClick={() => window.open('https://x.com/aligururDotJs', '_blank')}>@aligururdotjs</p>
      </div>
      <div className='flex flex-col items-center md:p-5 '>
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`md:h-12 md:w-12 h-6 w-6 border border-black flex items-center justify-center md:text-2xl md:font-extrabold text-sm font-bold
                  ${selectedPositions.some(
                  pos => pos.row === rowIndex && pos.col === colIndex
                ) ? 'bg-green-500' : 'bg-red-700'}`}
              >
                {selectedPositions.some(
                  pos => pos.row === rowIndex &&
                    pos.col === colIndex &&
                    (pos.letter === activeWord || foundLetters.includes(pos.letter))
                ) && cell}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className='flex flex-col items-center p-6 gap-4'>
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          maxLength={1}
        />
        <Button variant='outline' size='default' onClick={checkLetter}>
          Bul
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => {
        if (open === false && checkAllLettersFound(foundLetters)) {
          return;
        }
        setShowDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Tebrikler! 🎉
            </DialogTitle>
            <DialogDescription className="text-center space-y-2">
              <span className="block text-lg">Tüm harfleri buldunuz!</span>
              <span className="block font-semibold text-lg">
                Toplam deneme sayınız: {attempts}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={startNewLevel}
              className="w-full sm:w-auto"
            >
              Yeni Bölüm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Dialog */}
      <Dialog open={showFinalDialog} onOpenChange={setShowFinalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Oyun Bitti! 🎉
            </DialogTitle>
            <DialogDescription className="text-center space-y-2">
              <span className="block text-lg">5 Bölümü Tamamladınız!</span>
              {Object.entries(levelAttempts).map(([level, attempts]) => (
                <span key={level} className="block text-sm">
                  Bölüm {level}: {attempts} deneme
                </span>
              ))}
              <span className="block text-sm">
                Bölüm {currentLevel}: {attempts} deneme
              </span>
              <span className="block font-semibold text-lg mt-2">
                Toplam deneme sayınız: {totalAttempts}
              </span>
              <Input
                placeholder="İsminizi girin"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="mt-2"
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={saveScore} className="w-full sm:w-auto">
              Skoru Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Liderlik Tablosu */}
      <div className="mt-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">En İyi Dereceler</h2>
        <div className="bg-white rounded-lg shadow-md p-4">
          {leaderboard.map((score, index) => (
            <div
              key={score.id}
              className="flex justify-between items-center py-2 border-b last:border-0"
            >
              <span className="font-medium">
                {index + 1}. {score.playerName}
              </span>
              <span className="text-gray-600">
                {score.totalAttempts} deneme
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-4 right-4">
        <p className="font-bold">Seviye: {currentLevel}/5</p>
      </div>
    </div>
  );
}
