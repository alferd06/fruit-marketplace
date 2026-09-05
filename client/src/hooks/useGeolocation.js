import { useState } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('Browser tidak mendukung geolocation');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus('success');
      },
      (err) => {
        setStatus('error');
        setErrorMsg(
          err.code === 1
            ? 'Izin lokasi ditolak. Alamat manual tetap bisa dipakai.'
            : 'Gagal mendapatkan lokasi. Coba lagi.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return { location, status, errorMsg, requestLocation };
}