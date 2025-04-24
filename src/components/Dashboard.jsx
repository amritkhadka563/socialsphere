// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { FaHome, FaBell, FaUser, FaCompass } from 'react-icons/fa';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '../firebase';

const Dashboard = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [donationInput, setDonationInput] = useState('');
  const [donationSuccess, setDonationSuccess] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const userEmail = user?.email;
        const formatted = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isLikedByCurrentUser: data.likedBy?.includes(userEmail) || false
          };
        });
        setCampaigns(formatted);
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [user]);

  const toggleLike = async (id) => {
    const campaign = campaigns.find(c => c.id === id);
    const docRef = doc(db, 'campaigns', id);
    const userEmail = user?.email;
    const isLiked = campaign.likedBy?.includes(userEmail);

    if (isLiked) {
      await updateDoc(docRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userEmail)
      });
    } else {
      await updateDoc(docRef, {
        likes: increment(1),
        likedBy: arrayUnion(userEmail)
      });
    }

    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updatedLikedBy = isLiked
        ? c.likedBy.filter(email => email !== userEmail)
        : [...(c.likedBy || []), userEmail];
      return {
        ...c,
        likes: (c.likes || 0) + (isLiked ? -1 : 1),
        likedBy: updatedLikedBy,
        isLikedByCurrentUser: !isLiked
      };
    }));
  };

  const handleComment = async (id) => {
    if (!commentInput.trim()) return;
    const docRef = doc(db, 'campaigns', id);
    const newComment = {
      user: user?.displayName || user?.email || 'Anonymous',
      text: commentInput.trim()
    };
    await updateDoc(docRef, {
      comments: arrayUnion(newComment)
    });
    setCampaigns(prev => prev.map(c =>
      c.id === id ? { ...c, comments: [...(c.comments || []), newComment] } : c
    ));
    setCommentInput('');
  };

  const handleDonate = async (id) => {
    const amount = parseFloat(donationInput);
    if (!amount || amount <= 0) return;
    const campaign = campaigns.find(c => c.id === id);
    const newTotal = (campaign.donations || 0) + amount;
    if (newTotal > campaign.goal) return;

    const docRef = doc(db, 'campaigns', id);
    await updateDoc(docRef, {
      donations: increment(amount)
    });
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, donations: newTotal } : c));
    setDonationInput('');
    setDonationSuccess(true);
    setTimeout(() => setDonationSuccess(false), 3000);
  };

  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="card skeleton-card">
        <div className="skeleton-image" />
        <div className="skeleton-text title" />
        <div className="skeleton-text description" />
      </div>
    ))
  );

  const truncateText = (text, lines = 3) => {
    return text.split(' ').slice(0, 25).join(' ') + '...';
  };

  const calculateProgress = (donated, goal) => {
    const percent = Math.min((donated / goal) * 100, 100);
    return `${percent.toFixed(1)}%`;
  };

  return (
    <div className="dashboard">
      <div className="container">
        <aside className="sidebar">
          <h2 className="logo">SocialSphere</h2>
          <nav className="nav-links">
            <Link to="/dashboard" className="nav-item"><FaHome /> Home</Link>
            <Link to="/explore" className="nav-item"><FaCompass /> Explore</Link>
            <Link to="/notifications" className="nav-item"><FaBell /> Notifications</Link>
            <Link to="/profile" className="nav-item"><FaUser /> Profile</Link>
          </nav>
        </aside>

        <main className="feed">
          <header className="feed-header">
            <h1>Your Feed</h1>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link to="/create" className="upload-btn">Create</Link>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </header>

          <section className="feed-cards">
            {loading
              ? renderSkeleton()
              : campaigns.map(c => (
                <div key={c.id} className="card" onClick={() => setSelectedCampaign(c)}>
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.title} />
                  ) : (
                    <div style={{ height: '150px', background: '#eee' }}></div>
                  )}
                  <h3>{c.title}</h3>
                  <p className="truncate-description">{truncateText(c.description)}</p>
                  <div className="card-actions">
                    <span>❤️ {c.likes || 0}</span>
                    <span>💬 {(c.comments || []).length}</span>
                    <span>💰 ${c.donations || 0}</span>
                  </div>
                </div>
              ))}
          </section>

          {selectedCampaign && (
            <div className="campaign-modal-overlay" onClick={() => setSelectedCampaign(null)}>
              <div className="campaign-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setSelectedCampaign(null)}>×</button>
                {donationSuccess && <div className="donation-success">🎉 Thank you for your donation!</div>}
                <img src={selectedCampaign.imageUrl} alt={selectedCampaign.title} />
                <h2>{selectedCampaign.title}</h2>
                <p>{selectedCampaign.description}</p>
                <p><strong>Category:</strong> {selectedCampaign.category}</p>
                <p><strong>Goal:</strong> ${selectedCampaign.goal}</p>
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{ width: calculateProgress(selectedCampaign.donations || 0, selectedCampaign.goal) }}
                  >
                    {calculateProgress(selectedCampaign.donations || 0, selectedCampaign.goal)}
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className={selectedCampaign.isLikedByCurrentUser ? 'liked' : 'unliked'}
                    onClick={() => toggleLike(selectedCampaign.id)}
                  >
                    ❤️ {selectedCampaign.isLikedByCurrentUser ? 'Unlike' : 'Like'} ({selectedCampaign.likes || 0})
                  </button>
                </div>
                <div className="donate-section">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={donationInput}
                    onChange={(e) => setDonationInput(e.target.value)}
                  />
                  <button
                    className="donate-btn"
                    onClick={() => handleDonate(selectedCampaign.id)}
                    disabled={(selectedCampaign.donations || 0) >= selectedCampaign.goal}
                  >
                    💰 Donate
                  </button>
                </div>
                <div className="comment-section">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                  />
                  <button onClick={() => handleComment(selectedCampaign.id)}>💬 Post</button>
                </div>
                <div className="comments-list">
                  {(selectedCampaign.comments || []).map((com, i) => (
                    <p key={i}><strong>{com.user}:</strong> {com.text}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;