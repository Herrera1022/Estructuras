import React, { useState } from "react";
import { supabase } from "../supabaseClient";

function Estadisticas() {
  const [ligas, setLigas] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAcceder = async () => {
    setLoading(true);

    const { data, error } = await supabase.from("ligas").select("*");

    if (error) {
      console.error("Error al traer ligas:", error.message);
    } else {
      setLigas(data);
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Estadísticas Futbolísticas</h2>
      <button onClick={handleAcceder}>Acceder</button>

      {loading && <p>Cargando ligas...</p>}

      {ligas.length > 0 && (
        <table border="1" style={{ marginTop: "20px" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>País</th>
            </tr>
          </thead>
          <tbody>
            {ligas.map((liga) => (
              <tr key={liga.id}>
                <td>{liga.id}</td>
                <td>{liga.nombre}</td>
                <td>{liga.pais}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Estadisticas;
