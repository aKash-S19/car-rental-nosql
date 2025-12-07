import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [cars, setCars] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    transmission: 'Manual',
    fuelType: 'Petrol',
    seatingCapacity: 5,
    pricePerDay: '',
    color: '',
    plateNumber: '',
    images: '',
    features: '',
    description: ''
  });

  // Get userId from localStorage (assuming it's stored after login)
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAllCars();
  }, []);

  const fetchAllCars = async () => {
    try {
      const response = await axios.get('/api/cars');
      setCars(response.data.cars);
    } catch (error) {
      console.error('Error fetching cars:', error);
      alert('Failed to fetch cars');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const carData = {
        ...formData,
        userId,
        year: parseInt(formData.year),
        seatingCapacity: parseInt(formData.seatingCapacity),
        pricePerDay: parseFloat(formData.pricePerDay),
        images: formData.images ? formData.images.split(',').map(img => img.trim()) : [],
        features: formData.features ? formData.features.split(',').map(f => f.trim()) : []
      };

      if (editingCar) {
        await axios.put(`/api/cars/${editingCar._id}`, carData);
        alert('Car updated successfully!');
      } else {
        await axios.post('/api/cars/add', carData);
        alert('Car added successfully!');
      }

      resetForm();
      fetchAllCars();
    } catch (error) {
      console.error('Error saving car:', error);
      alert(error.response?.data?.message || 'Failed to save car');
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      transmission: car.transmission,
      fuelType: car.fuelType,
      seatingCapacity: car.seatingCapacity,
      pricePerDay: car.pricePerDay,
      color: car.color || '',
      plateNumber: car.plateNumber,
      images: car.images ? car.images.join(', ') : '',
      features: car.features ? car.features.join(', ') : '',
      description: car.description || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return;

    try {
      await axios.delete(`/api/cars/${carId}`, { data: { userId } });
      alert('Car deleted successfully!');
      fetchAllCars();
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('Failed to delete car');
    }
  };

  const handleStatusChange = async (carId, newStatus) => {
    try {
      await axios.patch(`/api/cars/${carId}/status`, {
        userId,
        availabilityStatus: newStatus
      });
      alert('Status updated successfully!');
      fetchAllCars();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      transmission: 'Manual',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: '',
      color: '',
      plateNumber: '',
      images: '',
      features: '',
      description: ''
    });
    setEditingCar(null);
    setShowAddForm(false);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Fleet Management Dashboard</h1>
        <button 
          className="btn-add-car"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add New Vehicle'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-car-form">
          <h2>{editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Brand *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Model *</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>

              <div className="form-group">
                <label>Transmission *</label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                  <option value="Semi-Automatic">Semi-Automatic</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fuel Type *</label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="form-group">
                <label>Seating Capacity *</label>
                <input
                  type="number"
                  name="seatingCapacity"
                  value={formData.seatingCapacity}
                  onChange={handleInputChange}
                  min="2"
                  max="15"
                  required
                />
              </div>

              <div className="form-group">
                <label>Price Per Day (₹) *</label>
                <input
                  type="number"
                  name="pricePerDay"
                  value={formData.pricePerDay}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Plate Number *</label>
                <input
                  type="text"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleInputChange}
                  required
                  disabled={editingCar}
                />
              </div>
            </div>

            <div className="form-group-full">
              <label>Image URLs (comma-separated)</label>
              <input
                type="text"
                name="images"
                value={formData.images}
                onChange={handleInputChange}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
            </div>

            <div className="form-group-full">
              <label>Features (comma-separated)</label>
              <input
                type="text"
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                placeholder="AC, GPS, Bluetooth, Sunroof"
              />
            </div>

            <div className="form-group-full">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingCar ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
              <button type="button" onClick={resetForm} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="cars-table">
        <h2>Fleet Overview ({cars.length} vehicles)</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Plate Number</th>
                <th>Specs</th>
                <th>Price/Day</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car._id}>
                  <td>
                    <strong>{car.brand} {car.model}</strong>
                    <br />
                    <small>{car.year}</small>
                  </td>
                  <td>{car.plateNumber}</td>
                  <td>
                    <div className="specs-cell">
                      <span>{car.transmission}</span>
                      <span>{car.fuelType}</span>
                      <span>{car.seatingCapacity} seats</span>
                    </div>
                  </td>
                  <td>₹{car.pricePerDay}</td>
                  <td>
                    <select
                      value={car.availabilityStatus}
                      onChange={(e) => handleStatusChange(car._id, e.target.value)}
                      className={`status-select ${car.availabilityStatus.toLowerCase()}`}
                    >
                      <option value="Available">Available</option>
                      <option value="Booked">Booked</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(car)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(car._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
