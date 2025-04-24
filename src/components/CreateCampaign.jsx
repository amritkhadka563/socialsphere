// CreateCampaign.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/CreateCampaign.css';

const CreateCampaign = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [goal, setGoal] = useState('');
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'socialsphere'); // your Cloudinary preset

    const res = await fetch('https://api.cloudinary.com/v1_1/ddsxrqtqo/image/upload', {
      method: 'POST',
      body: data
    });

    const result = await res.json();
    return result.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = '';
      if (image) {
        imageUrl = await uploadToCloudinary(image);
        if (!imageUrl) throw new Error("Image upload failed");
      }

      await addDoc(collection(db, 'campaigns'), {
        title,
        description,
        category,
        goal: Number(goal),
        imageUrl: imageUrl || '',
        createdAt: serverTimestamp()
      });

      navigate('/dashboard');
    } catch (error) {
      alert('Failed to create campaign: ' + error.message);
    }
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <div className="create-campaign-wrapper">
      <form className="create-campaign" onSubmit={handleSubmit}>
        <button type="button" className="close-btn" onClick={handleClose}>×</button>
        <h2>Create Campaign</h2>

        <label htmlFor="image-upload" className="image-upload">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="preview-image" />
          ) : (
            <span className="image-placeholder">📷</span>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
        </label>

        <label>Campaign Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about the campaign"
          required
        />

        <label>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select</option>
          <option value="education">Education</option>
          <option value="environment">Environment</option>
          <option value="business">Business</option>
          <option value="health">Health</option>
        </select>

        <label>Goal Amount</label>
        <input
          type="number"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          required
        />

        <button type="submit" className="submit-btn">Submit</button>
      </form>
    </div>
  );
};

export default CreateCampaign;