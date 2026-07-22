import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useState, useEffect, useCallback } from "react";
import { supabase } from './supabaseClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;



function App() {
  const [newName, setNewName] = useState("");
  const [resources, setResources] = useState([]);
  const [newAddress, setNewAddress] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newHours, setNewHours] = useState("");
  const [newDescription, setNewDescription] = useState("");

const [password, setPassword] = useState("");
const [isAuthenticated, setIsAuthenticated] = useState(false);  
const [selectedCategory ,setSelectedCategory] = useState("food");
const [newCategory, setNewCategory] = useState("food");
const [filteredResources, setFilteredResources] = useState([]);

const filterResources = useCallback((resources, selectedCategory) => {
  return resources.filter(n => n.category === selectedCategory && n.open === true);
}, []);

useEffect(() => {
  const filtered = filterResources(resources, selectedCategory);
  console.log("Category changed to:", selectedCategory);
  console.log("Filtered count:", filtered.length);
  setFilteredResources(filtered);
}, [selectedCategory, resources, filterResources]);

const fetchResources = useCallback(async () => {
  const { data, error } = await supabase
    .from('resources')
    .select('*');
  
  if (error) {
    console.error('Error fetching resources:', error);
  } else {
    setResources(data);
  }
}, []);

useEffect(() => {
  fetchResources();
}, [fetchResources]);


const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${address}&format=json`
  );
  const results = await response.json();
  if (results.length > 0) {
    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon)
    };
  }
  return null;
};

const handleSubmit = async () => {
  if (!newName || !newAddress) {
    alert("Please fill in a name and address");
    return;
  }

  const coords = await geocodeAddress(newAddress);
  if (!coords) {
    alert("Address not found — please try a more specific address");
    return;
  }

  const { error } = await supabase
    .from('resources')
    .insert([{
      name: newName,
      category: newCategory,
      address: newAddress,
      phone: newPhone,
      hours: newHours,
      description: newDescription,
      open: true,
      lat: coords.lat,
      lng: coords.lng
    }]);

  if (error) {
    console.error('Error adding resource:', error);
  } else {
    setNewName("");
    setNewCategory("food");
    setSelectedCategory(newCategory);
    setNewAddress("");
    setNewPhone("");
    setNewHours("");
    setNewDescription("");
    fetchResources();
  }
};

const handleDelete = async (id) => {
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting resource:', error);
  } else {
    fetchResources();
  }
};
const handleLogin = () => {
  if (password === "germination2026") {
    setIsAuthenticated(true);
  } else {
    alert("Incorrect password");
    setPassword("");
  }
};

 return (
  <div>
    {/* Title */}
    <h1 style={{ textAlign: "center" }}>Neighborhood Asset Map</h1>

    {/* Filter buttons */}
    <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
  <button onClick={() => setSelectedCategory("food")} style={{ background: selectedCategory === "food" ? "gray" : "silver" }}>Food</button>
  <button onClick={() => setSelectedCategory("health")} style={{ background: selectedCategory === "health" ? "gray" : "silver" }}>Health</button>
  <button onClick={() => setSelectedCategory("education")} style={{ background: selectedCategory === "education" ? "gray" : "silver" }}>Education</button>
  <button onClick={() => setSelectedCategory("shelter")} style={{ background: selectedCategory === "shelter" ? "gray" : "silver" }}>Shelter</button>
  <button onClick={() => setSelectedCategory("housing")} style={{ background: selectedCategory === "housing" ? "gray" : "silver" }}>Housing</button>
  <button onClick={() => setSelectedCategory("legal")} style={{ background: selectedCategory === "legal" ? "gray" : "silver" }}>Legal</button>
  <button onClick={() => setSelectedCategory("services")} style={{ background: selectedCategory === "services" ? "gray" : "silver" }}>Services</button>
</div>
 {isAuthenticated ? (
  <div style={{ marginTop: "10px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Resource name *" />
    <input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Address *" />
    <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone (optional)" />
    <input value={newHours} onChange={(e) => setNewHours(e.target.value)} placeholder="Hours (optional)" />
    <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description (optional)" />
    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
  <option value="food">Food</option>
  <option value="health">Health</option>
  <option value="education">Education</option>
  <option value="shelter">Shelter</option>
  <option value="housing">Housing</option>
  <option value="legal">Legal</option>
  <option value="services">Services</option>
</select>
    <button onClick={handleSubmit}>Add Resource</button>
  </div>
) : (
  <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px" }}>
    <input
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter password to add resources"
    />
    <button onClick={handleLogin}>Login</button>
  </div>
)}
    
    {/* Sidebar + Map side by side */}
    <div style={{ display: "flex", marginTop: "10px" }}>

      {/* Sidebar */}
      <div style={{ width: "300px", height: "500px", overflowY: "auto", borderRight: "1px solid #ccc" }}>
        <h3 style={{ textAlign: "center", padding: "10px" }}>Resources</h3>
        {filteredResources.map(resource => (
          <div key={resource.name} style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
            <strong>{resource.name}</strong>
            <p style={{ margin: 0, fontSize: "12px", color: "gray" }}>{resource.category}</p>
            {resource.address && <p style={{ margin: 0, fontSize: "12px" }}>{resource.address}</p>}
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <MapContainer
          key={selectedCategory}
          center={[39.9526, -75.1652]}
          zoom={12}
          style={{ width: "100%", height: "500px" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {filteredResources.map(resource => (
              <Marker key={`${resource.name}-${selectedCategory}`} position={[resource.lat, resource.lng]}>
              <Popup>
                <h3>{resource.name}</h3>
                <p><strong>Category:</strong> {resource.category}</p>
                {resource.address && <p><strong>Address:</strong> {resource.address}</p>}
                {resource.phone && <p><strong>Phone:</strong> {resource.phone}</p>}
                {resource.hours && <p><strong>Hours:</strong> {resource.hours}</p>}
                {resource.description && <p><strong>Description:</strong> {resource.description}</p>}
                {isAuthenticated && (
                  <button onClick={() => handleDelete(resource.id)}>Delete</button>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

    </div>
  </div>
);
}
export default App;