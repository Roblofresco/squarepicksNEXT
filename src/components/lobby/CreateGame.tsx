import { useState } from 'react';

interface CreateGameForm {
  title: string;
  sport: string;
  time: string;
  location: string;
  maxPlayers: number;
}

const INITIAL_FORM: CreateGameForm = {
  title: '',
  sport: 'basketball',
  time: '',
  location: '',
  maxPlayers: 10,
};

export default function CreateGame() {
  const [form, setForm] = useState<CreateGameForm>(INITIAL_FORM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    console.log('Form submitted:', form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Game Title
        </label>
        <input
          type="text"
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-gray-800/50 rounded-md px-3 py-2 text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="sport" className="block text-sm font-medium mb-1">
          Sport
        </label>
        <select
          id="sport"
          value={form.sport}
          onChange={(e) => setForm({ ...form, sport: e.target.value })}
          className="w-full bg-gray-800/50 rounded-md px-3 py-2 text-white"
        >
          <option value="basketball">Basketball</option>
          <option value="football">Football</option>
          <option value="baseball">Baseball</option>
          <option value="soccer">Soccer</option>
        </select>
      </div>

      <div>
        <label htmlFor="time" className="block text-sm font-medium mb-1">
          Time
        </label>
        <input
          type="time"
          id="time"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          className="w-full bg-gray-800/50 rounded-md px-3 py-2 text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="w-full bg-gray-800/50 rounded-md px-3 py-2 text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">
          Maximum Players
        </label>
        <input
          type="number"
          id="maxPlayers"
          value={form.maxPlayers}
          onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}
          min="2"
          className="w-full bg-gray-800/50 rounded-md px-3 py-2 text-white"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        Create Game
      </button>
    </form>
  );
} 