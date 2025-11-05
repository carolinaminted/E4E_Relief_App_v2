import React, { useState, useEffect } from 'react';

interface RegisterPageProps {
  onRegister: (firstName: string, lastName: string, email: string, password: string, fundCode: string) => boolean;
  switchToLogin: () => void;
  autofillTrigger: number;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, switchToLogin, autofillTrigger }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fundCode, setFundCode] = useState('');
  const [error, setError] = useState('');

  const generateFakeUserData = () => {
      const pokemonNames = [
        "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie", 
        "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate", 
        "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "NidoranF", "Nidorina", 
        "Nidoqueen", "NidoranM", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", 
        "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", 
        "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", 
        "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell", 
        "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro", 
        "Magnemite", "Magneton", "Farfetchd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", 
        "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", 
        "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing", 
        "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", 
        "Starmie", "MrMime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados", 
        "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", 
        "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew"
    ];

      const getRandomName = () => pokemonNames[Math.floor(Math.random() * pokemonNames.length)];

      let firstName = getRandomName();
      let lastName = getRandomName();
      while (firstName === lastName) {
          lastName = getRandomName();
      }

      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@fakemail.example`;
      const password = 'e4e';
      const funds = ['DOM', 'ROST', 'SSO'];
      const fundCode = funds[Math.floor(Math.random() * funds.length)];

      return { firstName, lastName, email, password, fundCode };
  };

  useEffect(() => {
    if (autofillTrigger > 0) {
      const { firstName, lastName, email, password, fundCode } = generateFakeUserData();
      setFirstName(firstName);
      setLastName(lastName);
      setEmail(email);
      setPassword(password);
      setFundCode(fundCode);
    }
  }, [autofillTrigger]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !fundCode) {
      setError('All fields are required.');
      return;
    }
    const success = onRegister(firstName, lastName, email, password, fundCode);
    if (!success) {
      setError('This email is already registered. Please try logging in.');
    } else {
      setError('');
    }
  };

  return (
    <div>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
            <div className="flex-1">
                <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">First Name</label>
                <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
                    required
                    autoComplete="given-name"
                />
            </div>
            <div className="flex-1">
                <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">Last Name</label>
                <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
                    required
                    autoComplete="family-name"
                />
            </div>
        </div>
        <div>
            <label htmlFor="email-register" className="block text-sm font-medium text-white mb-2">Email Address</label>
            <input
            type="email"
            id="email-register"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
            required
            autoComplete="email"
            />
        </div>
        <div>
            <label htmlFor="password-register" className="block text-sm font-medium text-white mb-2">Password</label>
            <input
            type="password"
            id="password-register"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
            required
            autoComplete="new-password"
            />
        </div>
        <div>
            <label htmlFor="fundCode" className="block text-sm font-medium text-white mb-2">Fund Code</label>
            <input
                type="text"
                id="fundCode"
                value={fundCode}
                onChange={(e) => setFundCode(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
                required
                autoComplete="off"
                aria-describedby="fund-code-help"
            />
            <p id="fund-code-help" className="text-xs text-gray-400 mt-1">Enter the code provided by your employer or program.</p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 !mt-6">
            Sign Up
        </button>
        <p className="text-sm text-center text-white">
            Already have an account?{' '}
            <button type="button" onClick={switchToLogin} className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 hover:underline">
            Sign In
            </button>
        </p>
        </form>
    </div>
  );
};

export default RegisterPage;