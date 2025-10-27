import sql from '../conection.js';

// Obtener todos los libros disponibles
export async function getAllLigas(req, res) {
	try {
		const books = await sql`select * from "ligas"`;
		res.json(books);
	} catch (error) {
		console.error('Error fetching ligas:', error);
		res.status(500).json({ error: 'Error fetching ligas' });
	}
} 