import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { fetchImages, fetchChildMortality, fetchExternalLinks } from '../services/api';
import ImageGallery from './ImageGallery';
import ChildMortalitySection from './ChildMortalitySection';
import ExternalLinks from './ExternalLinks';

// Get API base URL from environment variable
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const ArtworkInfoBar = ({
  countryISO,
  countryName,
  colors,
  mode,
  answerSubmitted,
  isCorrectAnswer,
  onClose,
  onNext
}) => {
  const [imagesByCollection, setImagesByCollection] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [mortalityData, setMortalityData] = useState(null);
  const [externalLinks, setExternalLinks] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const imageRefs = useRef({});
  const containerRef = useRef(null);

  /* START FADE IMMEDIATELY (NO DELAY) */
  useEffect(() => {
    if (!countryISO) return;

    setIsVisible(false);

    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, [countryISO]);

  /* FETCH IMAGES */
  useEffect(() => {
    if (!countryISO) {
      setImagesByCollection({});
      return;
    }

    setLoading(true);

    fetchImages(countryISO)
      .then(data => {
        const filtered = {};
        Object.entries(data || {}).forEach(([collection, images]) => {
          if (images && images.length > 0) {
            filtered[collection] = images;
          }
        });

        setImagesByCollection(filtered);

        const initialIndex = {};
        Object.keys(filtered).forEach(c => {
          initialIndex[c] = 0;
        });
        setCurrentImageIndex(initialIndex);
      })
      .catch(() => {
        setImagesByCollection({});
      })
      .finally(() => {
        setLoading(false);
      });
  }, [countryISO]);

  /* FETCH CHILD MORTALITY */
  useEffect(() => {
    if (!countryISO) {
      setMortalityData(null);
      return;
    }

    fetchChildMortality(countryISO)
      .then(setMortalityData)
      .catch(() => setMortalityData(null));
  }, [countryISO]);

  /* FETCH EXTERNAL LINKS */
  useEffect(() => {
    if (!countryISO) {
      setExternalLinks(null);
      return;
    }

    fetchExternalLinks(countryISO)
      .then(setExternalLinks)
      .catch(() => setExternalLinks(null));
  }, [countryISO]);

  /* IMAGE NAVIGATION */
  const nextImage = (collection) => {
    const images = imagesByCollection[collection];
    if (!images) return;

    setCurrentImageIndex(prev => ({
      ...prev,
      [collection]: (prev[collection] + 1) % images.length
    }));
  };

  const prevImage = (collection) => {
    const images = imagesByCollection[collection];
    if (!images) return;

    setCurrentImageIndex(prev => ({
      ...prev,
      [collection]: (prev[collection] - 1 + images.length) % images.length
    }));
  };

  /* CLEANUP IMAGE REFS */
  useEffect(() => {
    return () => {
      Object.values(imageRefs.current).forEach(img => {
        if (img) {
          img.src = '';
          img.removeAttribute('src');
        }
      });
      imageRefs.current = {};
    };
  }, [countryISO]);

  if (!countryISO) return null;

  const collections = Object.keys(imagesByCollection);

  return (
    <Box
      ref={containerRef}
      sx={{
        borderRadius: 1,
        p: 2,
        pb: 6,
        mb: 4,
        border: '5px solid',
        borderColor: colors.border,
        backdropFilter: 'blur(10px)',
        fontFamily: "'Roboto', Helvetica, sans-serif",
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        bgcolor: colors.cardBg,
        boxShadow: `0 0 20px ${colors.glow}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 5s cubic-bezier(0.4, 0.0, 0.2, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
        '&::-webkit-scrollbar': {
          width: '16px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: 1,
          m: 0.5,
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(200, 200, 200, 0.7)',
          borderRadius: 1,
          border: '3px solid rgba(0, 0, 0, 0.3)',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(230, 230, 230, 0.9)',
        },
      }}
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress sx={{ color: colors.linkColor }} />
          <Typography sx={{ ml: 2, color: colors.textPrimary }}>
            Loading images…
          </Typography>
        </Box>
      )}

      {!loading && (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              gap: 2,
              position: 'sticky',
              top: 0,
              bgcolor: 'rgba(0, 0, 0, 0.35)',
              zIndex: 10,
              pt: 1,
              pb: 1,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                m: 0,
                fontFamily: "'Roboto Condensed', Helvetica, sans-serif",
                color: colors.text,
                fontSize: '18pt',
                textAlign: 'center',
                fontWeight: 300,
                letterSpacing: '1.5px',
                flex: 1,
              }}
            >
              {mode === 'quiz' && answerSubmitted
                ? isCorrectAnswer
                  ? `Correct: ${countryName || countryISO}`
                  : `Incorrect: ${countryName || countryISO}`
                : countryName || countryISO}
            </Typography>

            {mode === 'quiz' && answerSubmitted && isCorrectAnswer && onNext ? (
              <Button
                onClick={onNext}
                endIcon={<ArrowForwardIcon />}
                variant="contained"
                sx={{
                  bgcolor: colors.bgBrownDark,
                  color: colors.linkColor,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '20px',
                  px: 2.5,
                  py: 1,
                  fontWeight: 'bold',
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: colors.buttonPrimary,
                    transform: 'scale(1.05)',
                    boxShadow: '0 0 15px rgba(139, 115, 85, 0.5)',
                  },
                }}
              >
                Next
              </Button>
            ) : onClose ? (
              <IconButton
                onClick={onClose}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.2)',
                  color: colors.linkColor,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  p: 0,
                  '&:hover': {
                    bgcolor: colors.glow,
                    color: colors.background,
                    transform: 'scale(1.1) rotate(90deg)',
                    boxShadow: `0 0 10px ${colors.glow}`,
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            ) : null}
          </Box>

          {collections.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {collections.map(collection => (
                <ImageGallery
                  key={collection}
                  collection={collection}
                  images={imagesByCollection[collection]}
                  countryName={countryName}
                  currentIndex={currentImageIndex[collection] || 0}
                  onPrev={() => prevImage(collection)}
                  onNext={() => nextImage(collection)}
                  imageRef={el => (imageRefs.current[collection] = el)}
                  colors={colors}
                />
              ))}
            </Box>
          )}

          <ExternalLinks externalLinks={externalLinks} countryName={countryName} colors={colors} />
          <ChildMortalitySection mortalityData={mortalityData} colors={colors} />
        </>
      )}
    </Box>
  );
};

export default ArtworkInfoBar;
