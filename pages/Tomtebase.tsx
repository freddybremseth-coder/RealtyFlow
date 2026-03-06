
import React from 'react';
import { PLOT_DATA } from '../plot-data'; // Assuming plot-data.ts is in the same directory

const Tomtebase: React.FC = () => {
  return (
    <div>
      <h1>Tomtebase</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Size (m²)</th>
            <th>Price (€)</th>
            <th>Cadastral Number</th>
            <th>Location (Lat, Lng)</th>
            <th>Type</th>
            <th>Water</th>
            <th>Electricity</th>
            <th>Notes</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {PLOT_DATA.map(plot => (
            <tr key={plot.id}>
              <td>{plot.name}</td>
              <td>{plot.description}</td>
              <td>{plot.status}</td>
              <td>{plot.size}</td>
              <td>{plot.price}</td>
              <td>{plot.cadastralNumber}</td>
              <td>{plot.location.lat}, {plot.location.lng}</td>
              <td>{plot.type}</td>
              <td>{plot.water}</td>
              <td>{plot.electricity}</td>
              <td>{plot.notes}</td>
              <td>{plot.imageUrl && <img src={plot.imageUrl} alt={plot.name} width="100" />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tomtebase;
