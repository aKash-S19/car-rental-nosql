import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './VehicleCatalog.css';

const VehicleCatalog = () => {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    transmission: '',
    fuelType: '',
    minPrice: '',
    maxPrice: '',
    seatingCapacity: '',
    availabilityStatus: 'Available'
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cars', { params: filters });
      setCars(response.data.cars);
      setFilteredCars(response.data.cars);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cars:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchCars();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      brand: '',
      transmission: '',
      fuelType: '',
      minPrice: '',
      maxPrice: '',
      seatingCapacity: '',
      availabilityStatus: 'Available'
    });
    setTimeout(() => fetchCars(), 100);
  };

  if (loading) {
    return <div className="loading">Loading vehicles...</div>;
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="vehicle-catalog">
      <div className="catalog-header">
        <div>
          <h1>Available Vehicles</h1>
          <p>Find the perfect car for your journey</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          {user.id && <Link to="/dashboard" style={{color: 'white', textDecoration: 'none', padding: '8px 16px', background: '#3498db', borderRadius: '5px'}}>← Dashboard</Link>}
          <Link to="/" style={{color: 'white', textDecoration: 'none', padding: '8px 16px', background: '#7f8c8d', borderRadius: '5px'}}>← Home</Link>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-grid">
          <input
            type="text"
            name="search"
            placeholder="Search by brand or model..."
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />

          <select
            name="transmission"
            value={filters.transmission}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Transmission</option>
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
            <option value="Semi-Automatic">Semi-Automatic</option>
          </select>

          <select
            name="fuelType"
            value={filters.fuelType}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Fuel Types</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          <select
            name="seatingCapacity"
            value={filters.seatingCapacity}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Seating</option>
            <option value="2">2 Seater</option>
            <option value="4">4 Seater</option>
            <option value="5">5 Seater</option>
            <option value="7">7 Seater</option>
            <option value="8">8+ Seater</option>
          </select>

          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="filter-input"
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>

        <div className="filter-actions">
          <button onClick={applyFilters} className="btn-primary">Apply Filters</button>
          <button onClick={resetFilters} className="btn-secondary">Reset</button>
        </div>
      </div>

      <div className="cars-grid">
        {filteredCars.length === 0 ? (
          <div className="no-results">
            <p>No vehicles found matching your criteria</p>
          </div>
        ) : (
          filteredCars.map((car) => (
            <div key={car._id} className="car-card">
              <div className="car-image">
                {car.images && car.images.length > 0 ? (
                  <img src={car.images[0]} alt={`${car.brand} ${car.model}`} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <span className={`status-badge ${car.availabilityStatus.toLowerCase()}`}>
                  {car.availabilityStatus}
                </span>
              </div>

              <div className="car-details">
                <h3>{car.brand} {car.model}</h3>
                <p className="car-year">{car.year}</p>

                <div className="car-specs">
                  <span><i className="icon">🔧</i> {car.transmission}</span>
                  <span><i className="icon">⛽</i> {car.fuelType}</span>
                  <span><i className="icon">👥</i> {car.seatingCapacity} Seats</span>
                </div>

                {car.features && car.features.length > 0 && (
                  <div className="car-features">
                    {car.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                )}

                <div className="car-footer">
                  <div className="price">
                    <span className="price-amount">₹{car.pricePerDay}</span>
                    <span className="price-unit">/day</span>
                  </div>
                  <button 
                    className="btn-book"
                    disabled={car.availabilityStatus !== 'Available'}
                    onClick={() => window.location.href = `/book/${car._id}`}
                  >
                    {car.availabilityStatus === 'Available' ? 'Book Now' : 'Not Available'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VehicleCatalog;
