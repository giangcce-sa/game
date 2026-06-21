import React, { useEffect, useState } from 'react';
import { getIpa } from '../lib/ipaCache';

// Vietnamese learners commonly struggle with these phonemes
const HARD_PHONEMES = ['θ', 'ʃ', 'ʒ', 'æ', 'ʌ', 'ɜː', 'ɜ', 'ð', 'ŋ'];
const PHONEME_TIPS = {
  'θ': 'Đặt đầu lưỡi giữa hai hàm răng, thổi hơi nhẹ',
  'ð': 'Giống θ nhưng rung thanh quản',
  'ʃ': 'Giống "sh" — môi tròn, hơi dài',
  'ʒ': 'Giống ʃ nhưng rung thanh quản (như "zh")',
  'æ': 'Há miệng rộng, kéo dài hơn âm "e"',
  'ʌ': 'Giống "â" tiếng Việt nhưng ngắn hơn',
  'ɜː': 'Giống "ơ" tiếng Việt nhưng dài hơn, môi không tròn',
  'ɜ': 'Giống "ơ" ngắn',
  'ŋ': 'Âm "ng" cuối từ (không có âm i/g phía sau)',
};

function highlightIpa(ipa) {
  if (!ipa) return null;
  const parts = [];
  let i = 0;
  const str = ipa.replace(/^\/|\/$/g, '');
  while (i < str.length) {
    let matched = false;
    for (const p of HARD_PHONEMES) {
      if (str.startsWith(p, i)) {
        const tip = PHONEME_TIPS[p];
        parts.push(
          <span
            key={i}
            title={tip || 'Âm khó với người Việt'}
            style={{
              color: '#e67e22', fontWeight: 800,
              borderBottom: '2px dashed #e67e22',
              cursor: 'help',
            }}
          >
            {p}
          </span>
        );
        i += p.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      parts.push(str[i]);
      i++;
    }
  }
  return parts;
}

export default function IpaDisplay({ word, style = {} }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!word) return;
    setLoading(true);
    getIpa(word).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [word]);

  if (loading) {
    return (
      <span style={{ fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic', ...style }}>
        /…/
      </span>
    );
  }

  if (!data?.ipa) return null;

  return (
    <span style={{
      fontSize: '0.9rem', fontFamily: 'monospace',
      color: '#555', letterSpacing: '0.03em', ...style
    }}>
      /{highlightIpa(data.ipa)}/
    </span>
  );
}
