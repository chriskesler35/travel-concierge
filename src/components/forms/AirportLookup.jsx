
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAirports } from '@/api/functions';
import { Input } from '@/components/ui/input';
import { Loader2, Plane } from 'lucide-react';
import { debounce } from 'lodash';

const allAirports = [
    // Major International Airports
    { iata: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'US' },
    { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'US' },
    { iata: 'ORD', name: 'O\'Hare International', city: 'Chicago', country: 'US' },
    { iata: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'US' },
    { iata: 'DAL', name: 'Dallas Love Field', city: 'Dallas', country: 'US' },
    { iata: 'DEN', name: 'Denver International', city: 'Denver', country: 'US' },
    { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'US' },
    { iata: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'US' },
    { iata: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'US' },
    { iata: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'US' },
    { iata: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'US' },
    { iata: 'LAS', name: 'McCarran International', city: 'Las Vegas', country: 'US' },
    { iata: 'MCO', name: 'Orlando International', city: 'Orlando', country: 'US' },
    { iata: 'MIA', name: 'Miami International', city: 'Miami', country: 'US' },
    { iata: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', country: 'US' },
    { iata: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'US' },
    { iata: 'HOU', name: 'William P. Hobby Airport', city: 'Houston', country: 'US' },
    { iata: 'BOS', name: 'Logan International', city: 'Boston', country: 'US' },
    { iata: 'BWI', name: 'Baltimore/Washington International', city: 'Baltimore', country: 'US' },
    { iata: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington DC', country: 'US' },
    { iata: 'IAD', name: 'Washington Dulles International', city: 'Washington DC', country: 'US' },
    { iata: 'MSP', name: 'Minneapolis-St. Paul International', city: 'Minneapolis', country: 'US' },
    { iata: 'DTW', name: 'Detroit Metropolitan Wayne County', city: 'Detroit', country: 'US' },
    { iata: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', country: 'US' },
    { iata: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', country: 'US' },
    { iata: 'FLL', name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale', country: 'US' },
    { iata: 'TPA', name: 'Tampa International', city: 'Tampa', country: 'US' },
    { iata: 'SAN', name: 'San Diego International', city: 'San Diego', country: 'US' },
    { iata: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', country: 'US' },
    { iata: 'PDX', name: 'Portland International', city: 'Portland', country: 'US' },
    { iata: 'STL', name: 'Lambert-St. Louis International', city: 'St. Louis', country: 'US' },
    { iata: 'BNA', name: 'Nashville International', city: 'Nashville', country: 'US' },
    { iata: 'MCI', name: 'Kansas City International', city: 'Kansas City', country: 'US' },
    { iata: 'RDU', name: 'Raleigh-Durham International', city: 'Raleigh', country: 'US' },
    { iata: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', country: 'US' },
    { iata: 'SAT', name: 'San Antonio International', city: 'San Antonio', country: 'US' },
    { iata: 'OKC', name: 'Will Rogers World Airport', city: 'Oklahoma City', country: 'US' },
    { iata: 'TUL', name: 'Tulsa International', city: 'Tulsa', country: 'US' },
    { iata: 'ABQ', name: 'Albuquerque International Sunport', city: 'Albuquerque', country: 'US' },
    { iata: 'ELP', name: 'El Paso International', city: 'El Paso', country: 'US' },

    // Small US Regional Airports
    { iata: 'ACK', name: 'Nantucket Memorial Airport', city: 'Nantucket', country: 'US' },
    { iata: 'MVY', name: 'Martha\'s Vineyard Airport', city: 'Martha\'s Vineyard', country: 'US' },
    { iata: 'HYA', name: 'Barnstable Municipal Airport', city: 'Hyannis', country: 'US' },
    { iata: 'PVD', name: 'T.F. Green Airport', city: 'Providence', country: 'US' },
    { iata: 'BGR', name: 'Bangor International Airport', city: 'Bangor', country: 'US' },
    { iata: 'PWM', name: 'Portland International Jetport', city: 'Portland', country: 'US' },
    { iata: 'BTV', name: 'Burlington International Airport', city: 'Burlington', country: 'US' },
    { iata: 'ALB', name: 'Albany International Airport', city: 'Albany', country: 'US' },
    { iata: 'SYR', name: 'Syracuse Hancock International Airport', city: 'Syracuse', country: 'US' },
    { iata: 'ROC', name: 'Frederick Douglass Greater Rochester International Airport', city: 'Rochester', country: 'US' },
    { iata: 'BUF', name: 'Buffalo Niagara International Airport', city: 'Buffalo', country: 'US' },
    { iata: 'ELM', name: 'Elmira/Corning Regional Airport', city: 'Elmira/Corning', country: 'US' },
    { iata: 'ITH', name: 'Ithaca Tompkins Regional Airport', city: 'Ithaca', country: 'US' },
    { iata: 'SWF', name: 'New York Stewart International Airport', city: 'Newburgh', country: 'US' },
    { iata: 'HPN', name: 'Westchester County Airport', city: 'White Plains', country: 'US' },
    { iata: 'ISP', name: 'Long Island MacArthur Airport', city: 'Islip', country: 'US' },
    { iata: 'ACY', name: 'Atlantic City International Airport', city: 'Atlantic City', country: 'US' },
    { iata: 'TTN', name: 'Trenton-Mercer Airport', city: 'Trenton', country: 'US' },
    { iata: 'ABE', name: 'Lehigh Valley International Airport', city: 'Allentown', country: 'US' },
    { iata: 'ERI', name: 'Erie International Airport', city: 'Erie', country: 'US' },

    // Colorado Airports (including very small regional)
    { iata: 'COS', name: 'Colorado Springs Airport', city: 'Colorado Springs', country: 'US' },
    { iata: 'GJT', name: 'Grand Junction Regional', city: 'Grand Junction', country: 'US' },
    { iata: 'ASE', name: 'Aspen/Pitkin County Airport', city: 'Aspen', country: 'US' },
    { iata: 'EGE', name: 'Eagle County Regional', city: 'Vail/Eagle', country: 'US' },
    { iata: 'HDN', name: 'Yampa Valley Airport', city: 'Steamboat Springs', country: 'US' },
    { iata: 'GUC', name: 'Gunnison-Crested Butte Regional', city: 'Gunnison', country: 'US' },
    { iata: 'MTJ', name: 'Montrose Regional', city: 'Montrose', country: 'US' },
    { iata: 'DRO', name: 'Durango-La Plata County', city: 'Durango', country: 'US' },
    { iata: 'PUB', name: 'Pueblo Memorial Airport', city: 'Pueblo', country: 'US' },
    { iata: 'AKO', name: 'Akron-Washington County', city: 'Akron', country: 'US' },

    // Montana/Wyoming Regional
    { iata: 'BZN', name: 'Bozeman Yellowstone International', city: 'Bozeman', country: 'US' },
    { iata: 'COD', name: 'Yellowstone Regional', city: 'Cody', country: 'US' },
    { iata: 'JAC', name: 'Jackson Hole Airport', city: 'Jackson', country: 'US' },
    { iata: 'BIL', name: 'Billings Logan International', city: 'Billings', country: 'US' },
    { iata: 'MSO', name: 'Missoula Montana Airport', city: 'Missoula', country: 'US' },
    { iata: 'GTF', name: 'Great Falls International', city: 'Great Falls', country: 'US' },
    { iata: 'HLN', name: 'Helena Regional', city: 'Helena', country: 'US' },
    { iata: 'BTM', name: 'Bert Mooney Airport', city: 'Butte', country: 'US' },
    { iata: 'GPI', name: 'Glacier Park International', city: 'Kalispell', country: 'US' },
    { iata: 'CPR', name: 'Casper-Natrona County International', city: 'Casper', country: 'US' },
    { iata: 'CYS', name: 'Cheyenne Regional', city: 'Cheyenne', country: 'US' },
    { iata: 'LAR', name: 'Laramie Regional', city: 'Laramie', country: 'US' },
    { iata: 'RIW', name: 'Riverton Regional', city: 'Riverton', country: 'US' },

    // Idaho Regional
    { iata: 'BOI', name: 'Boise Airport', city: 'Boise', country: 'US' },
    { iata: 'SUN', name: 'Friedman Memorial Airport', city: 'Sun Valley/Hailey', country: 'US' },
    { iata: 'IDA', name: 'Idaho Falls Regional', city: 'Idaho Falls', country: 'US' },
    { iata: 'TWF', name: 'Magic Valley Regional', city: 'Twin Falls', country: 'US' },
    { iata: 'PIH', name: 'Pocatello Regional', city: 'Pocatello', country: 'US' },
    { iata: 'LWS', name: 'Lewiston-Nez Perce County', city: 'Lewiston', country: 'US' },

    // Nevada Regional
    { iata: 'RNO', name: 'Reno-Tahoe International', city: 'Reno', country: 'US' },
    { iata: 'EKO', name: 'Elko Regional', city: 'Elko', country: 'US' },

    // Arizona Regional
    { iata: 'FLG', name: 'Flagstaff Pulliam Airport', city: 'Flagstaff', country: 'US' },
    { iata: 'TUS', name: 'Tucson International', city: 'Tucson', country: 'US' },
    { iata: 'YUM', name: 'Yuma International', city: 'Yuma', country: 'US' },
    { iata: 'PRC', name: 'Ernest A. Love Field', city: 'Prescott', country: 'US' },
    { iata: 'SDL', name: 'Scottsdale Airport', city: 'Scottsdale', country: 'US' },

    // California Regional including many smaller airports
    { iata: 'SBA', name: 'Santa Barbara Municipal', city: 'Santa Barbara', country: 'US' },
    { iata: 'SMX', name: 'Santa Maria Public', city: 'Santa Maria', country: 'US' },
    { iata: 'SLO', name: 'San Luis County Regional', city: 'San Luis Obispo', country: 'US' },
    { iata: 'MOD', name: 'Modesto City-County', city: 'Modesto', country: 'US' },
    { iata: 'FAT', name: 'Fresno Yosemite International', city: 'Fresno', country: 'US' },
    { iata: 'BFL', name: 'Meadows Field', city: 'Bakersfield', country: 'US' },
    { iata: 'STS', name: 'Charles M. Schulz Sonoma County', city: 'Santa Rosa', country: 'US' },
    { iata: 'ACV', name: 'Arcata-Eureka Airport', city: 'Arcata', country: 'US' },
    { iata: 'RDD', name: 'Redding Municipal', city: 'Redding', country: 'US' },
    { iata: 'MMH', name: 'Mammoth Yosemite Airport', city: 'Mammoth Lakes', country: 'US' },
    { iata: 'MRY', name: 'Monterey Regional Airport', city: 'Monterey', country: 'US' },
    { iata: 'SJC', name: 'Norman Y. Mineta San Jose International', city: 'San Jose', country: 'US' },
    { iata: 'OAK', name: 'Oakland International', city: 'Oakland', country: 'US' },
    { iata: 'BUR', name: 'Bob Hope Airport', city: 'Burbank', country: 'US' },
    { iata: 'SNA', name: 'John Wayne Airport', city: 'Orange County', country: 'US' },
    { iata: 'PSP', name: 'Palm Springs International', city: 'Palm Springs', country: 'US' },

    // Oregon/Washington Regional
    { iata: 'EUG', name: 'Eugene Airport', city: 'Eugene', country: 'US' },
    { iata: 'MFR', name: 'Rogue Valley International-Medford', city: 'Medford', country: 'US' },
    { iata: 'RDM', name: 'Roberts Field', city: 'Redmond/Bend', country: 'US' },
    { iata: 'LMT', name: 'Klamath Falls Airport', city: 'Klamath Falls', country: 'US' },
    { iata: 'PSC', name: 'Tri-Cities Airport', city: 'Pasco', country: 'US' },
    { iata: 'GEG', name: 'Spokane International', city: 'Spokane', country: 'US' },
    { iata: 'YKM', name: 'Yakima Air Terminal', city: 'Yakima', country: 'US' },
    { iata: 'BLI', name: 'Bellingham International', city: 'Bellingham', country: 'US' },
    { iata: 'OLM', name: 'Olympia Regional', city: 'Olympia', country: 'US' },

    // Alaska Regional
    { iata: 'ANC', name: 'Ted Stevens Anchorage International', city: 'Anchorage', country: 'US' },
    { iata: 'FAI', name: 'Fairbanks International', city: 'Fairbanks', country: 'US' },
    { iata: 'JNU', name: 'Juneau International', city: 'Juneau', country: 'US' },
    { iata: 'KTN', name: 'Ketchikan International', city: 'Ketchikan', country: 'US' },
    { iata: 'SIT', name: 'Sitka Rocky Gutierrez Airport', city: 'Sitka', country: 'US' },

    // Hawaii
    { iata: 'HNL', name: 'Daniel K. Inouye International', city: 'Honolulu', country: 'US' },
    { iata: 'OGG', name: 'Kahului Airport', city: 'Kahului', country: 'US' },
    { iata: 'KOA', name: 'Ellison Onizuka Kona International Airport', city: 'Kailua-Kona', country: 'US' },
    { iata: 'ITO', name: 'Hilo International Airport', city: 'Hilo', country: 'US' },
    { iata: 'LIH', name: 'Lihue Airport', city: 'Lihue', country: 'US' },
    { iata: 'MKK', name: 'Molokai Airport', city: 'Kaunakakai', country: 'US' },
    { iata: 'LNY', name: 'Lanai Airport', city: 'Lanai City', country: 'US' },

    // Canada - Major and Regional
    { iata: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada' },
    { iata: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada' },
    { iata: 'YYC', name: 'Calgary International', city: 'Calgary', country: 'Canada' },
    { iata: 'YEG', name: 'Edmonton International', city: 'Edmonton', country: 'Canada' },
    { iata: 'YWG', name: 'Winnipeg Richardson International', city: 'Winnipeg', country: 'Canada' },
    { iata: 'YUL', name: 'Montreal-Pierre Elliott Trudeau International', city: 'Montreal', country: 'Canada' },
    { iata: 'YOW', name: 'Ottawa Macdonald-Cartier International', city: 'Ottawa', country: 'Canada' },
    { iata: 'YHZ', name: 'Halifax Stanfield International', city: 'Halifax', country: 'Canada' },

    // Europe - Major Airports
    { iata: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK' },
    { iata: 'LGW', name: 'London Gatwick', city: 'London', country: 'UK' },
    { iata: 'STN', name: 'London Stansted', city: 'London', country: 'UK' },
    { iata: 'LTN', name: 'London Luton', city: 'London', country: 'UK' },
    { iata: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'UK' },
    { iata: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'UK' },
    { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
    { iata: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France' },
    { iata: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands' },
    { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
    { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany' },
    { iata: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany' },
    { iata: 'FCO', name: 'Leonardo da Vinci-Fiumicino', city: 'Rome', country: 'Italy' },
    { iata: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy' },
    { iata: 'VCE', name: 'Venice Marco Polo', city: 'Venice', country: 'Italy' },
    { iata: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain' },
    { iata: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', country: 'Spain' },
    { iata: 'ZUR', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
    { iata: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland' },
    { iata: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'Austria' },
    { iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark' },
    { iata: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden' },
    { iata: 'OSL', name: 'Oslo Airport', city: 'Oslo', country: 'Norway' },
    { iata: 'HEL', name: 'Helsinki Airport', city: 'Helsinki', country: 'Finland' },
    { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
    { iata: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece' },
    { iata: 'LIS', name: 'Lisbon Airport', city: 'Lisbon', country: 'Portugal' },
    { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland' },
    
    // Caribbean & Tropical
    { iata: 'CUN', name: 'Cancún International', city: 'Cancun', country: 'Mexico' },
    { iata: 'SJU', name: 'Luis Muñoz Marín International', city: 'San Juan', country: 'Puerto Rico' },
    { iata: 'STT', name: 'Cyril E. King Airport', city: 'Charlotte Amalie', country: 'U.S. Virgin Islands' },
    { iata: 'STX', name: 'Henry E. Rohlsen Airport', city: 'Christiansted', country: 'U.S. Virgin Islands' },
    { iata: 'NAS', name: 'Lynden Pindling International', city: 'Nassau', country: 'Bahamas' },
    { iata: 'MBJ', name: 'Sangster International', city: 'Montego Bay', country: 'Jamaica' },
    { iata: 'KIN', name: 'Norman Manley International', city: 'Kingston', country: 'Jamaica' },
    { iata: 'PUJ', name: 'Punta Cana International', city: 'Punta Cana', country: 'Dominican Republic' },
    { iata: 'SDQ', name: 'Las Américas International', city: 'Santo Domingo', country: 'Dominican Republic' },
    { iata: 'AUA', name: 'Queen Beatrix International', city: 'Oranjestad', country: 'Aruba' },
    { iata: 'CUR', name: 'Hato International', city: 'Willemstad', country: 'Curaçao' },
    { iata: 'BON', name: 'Flamingo International', city: 'Kralendijk', country: 'Bonaire' },
    { iata: 'SXM', name: 'Princess Juliana International', city: 'Philipsburg', country: 'Sint Maarten' },
    { iata: 'BGI', name: 'Grantley Adams International', city: 'Bridgetown', country: 'Barbados' },
    { iata: 'GCM', name: 'Owen Roberts International', city: 'George Town', country: 'Cayman Islands' },
    
    // Asia Pacific
    { iata: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan' },
    { iata: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan' },
    { iata: 'KIX', name: 'Kansai International', city: 'Osaka', country: 'Japan' },
    { iata: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea' },
    { iata: 'GMP', name: 'Gimpo International', city: 'Seoul', country: 'South Korea' },
    { iata: 'PEK', name: 'Beijing Capital International', city: 'Beijing', country: 'China' },
    { iata: 'PVG', name: 'Shanghai Pudong International', city: 'Shanghai', country: 'China' },
    { iata: 'CAN', name: 'Guangzhou Baiyun International', city: 'Guangzhou', country: 'China' },
    { iata: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong' },
    { iata: 'TPE', name: 'Taiwan Taoyuan International', city: 'Taipei', country: 'Taiwan' },
    { iata: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore' },
    { iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
    { iata: 'DMK', name: 'Don Mueang International', city: 'Bangkok', country: 'Thailand' },
    { iata: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia' },
    { iata: 'CGK', name: 'Soekarno-Hatta International', city: 'Jakarta', country: 'Indonesia' },
    { iata: 'DPS', name: 'Ngurah Rai International', city: 'Denpasar', country: 'Indonesia' },
    { iata: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines' },
    { iata: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia' },
    { iata: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia' },
    { iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia' },
    { iata: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia' },
    { iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand' },
    { iata: 'CHC', name: 'Christchurch Airport', city: 'Christchurch', country: 'New Zealand' },
    { iata: 'WLG', name: 'Wellington Airport', city: 'Wellington', country: 'New Zealand' },
    
    // Middle East
    { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
    { iata: 'DWC', name: 'Al Maktoum International', city: 'Dubai', country: 'UAE' },
    { iata: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'UAE' },
    { iata: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar' },
    { iata: 'RUH', name: 'King Khalid International', city: 'Riyadh', country: 'Saudi Arabia' },
    { iata: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia' },
    { iata: 'KWI', name: 'Kuwait International', city: 'Kuwait City', country: 'Kuwait' },
    { iata: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt' },
    { iata: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel' },
    
    // Africa
    { iata: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa' },
    { iata: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa' },
    { iata: 'ADD', name: 'Addis Ababa Bole International', city: 'Addis Ababa', country: 'Ethiopia' },
    { iata: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya' },
    { iata: 'LOS', name: 'Murtala Muhammed International', city: 'Lagos', country: 'Nigeria' },
    { iata: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Morocco' },
    { iata: 'TUN', name: 'Tunis-Carthage International', city: 'Tunis', country: 'Tunisia' },
    
    // South America
    { iata: 'GRU', name: 'São Paulo-Guarulhos International', city: 'São Paulo', country: 'Brazil' },
    { iata: 'CGH', name: 'São Paulo-Congonhas Airport', city: 'São Paulo', country: 'Brazil' },
    { iata: 'GIG', name: 'Rio de Janeiro-Galeão International', city: 'Rio de Janeiro', country: 'Brazil' },
    { iata: 'SDU', name: 'Santos Dumont Airport', city: 'Rio de Janeiro', country: 'Brazil' },
    { iata: 'BSB', name: 'Brasília International', city: 'Brasília', country: 'Brazil' },
    { iata: 'SCL', name: 'Santiago International', city: 'Santiago', country: 'Chile' },
    { iata: 'EZE', name: 'Ezeiza International', city: 'Buenos Aires', country: 'Argentina' },
    { iata: 'AEP', name: 'Jorge Newbery Airfield', city: 'Buenos Aires', country: 'Argentina' },
    { iata: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Peru' },
    { iata: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia' },
    { iata: 'UIO', name: 'Mariscal Sucre International', city: 'Quito', country: 'Ecuador' },
    { iata: 'PTY', name: 'Tocumen International', city: 'Panama City', country: 'Panama' },
    
    // Mexico & Central America
    { iata: 'MEX', name: 'Mexico City International', city: 'Mexico City', country: 'Mexico' },
    { iata: 'GDL', name: 'Guadalajara Airport', city: 'Guadalajara', country: 'Mexico' },
    { iata: 'MTY', name: 'Monterrey International', city: 'Monterrey', country: 'Mexico' },
    { iata: 'PVR', name: 'Puerto Vallarta International', city: 'Puerto Vallarta', country: 'Mexico' },
    { iata: 'CZM', name: 'Cozumel International', city: 'Cozumel', country: 'Mexico' },
    { iata: 'SJD', name: 'Los Cabos International', city: 'Los Cabos', country: 'Mexico' },
    { iata: 'TIJ', name: 'Tijuana International', city: 'Tijuana', country: 'Mexico' },
    { iata: 'SJO', name: 'Juan Santamaría International', city: 'San José', country: 'Costa Rica' },
    { iata: 'LIR', name: 'Daniel Oduber Quirós International', city: 'Liberia', country: 'Costa Rica' },
    { iata: 'GUA', name: 'La Aurora International', city: 'Guatemala City', country: 'Guatemala' },
    { iata: 'SAL', name: 'Monseñor Óscar Arnulfo Romero International', city: 'San Salvador', country: 'El Salvador' },
    { iata: 'TGU', name: 'Toncontín International', city: 'Tegucigalpa', country: 'Honduras' },
    { iata: 'MGA', name: 'Augusto C. Sandino International', city: 'Managua', country: 'Nicaragua' },
    { iata: 'BZE', name: 'Philip S. W. Goldson International', city: 'Belize City', country: 'Belize' },
];

export default function AirportLookup({ onSelect, placeholder = "City or Airport Code", initialValue = "", isInvalid = false }) {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef(null);

    const searchAirports = (searchQuery) => {
        if (searchQuery.length < 2) {
            return [];
        }

        const lowerCaseQuery = searchQuery.toLowerCase();
        return allAirports.filter(airport => 
            airport.iata.toLowerCase().includes(lowerCaseQuery) ||
            airport.name.toLowerCase().includes(lowerCaseQuery) ||
            airport.city.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 15); // Increased to show more results
    };

    const fetchSuggestions = async (searchQuery) => {
        if (searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }
        
        setIsLoading(true);
        
        try {
            // Try API first
            const response = await getAirports({ query: searchQuery });
            if (response?.data && response.data.length > 0) {
                setSuggestions(response.data);
            } else {
                // Fallback to inline data
                const results = searchAirports(searchQuery);
                setSuggestions(results);
            }
        } catch (error) {
            console.error("Error fetching airports, using fallback:", error);
            // Fallback to inline data
            const results = searchAirports(searchQuery);
            setSuggestions(results);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedFetch = useCallback(debounce(fetchSuggestions, 300), []);

    useEffect(() => {
        if (query && query.length >= 2) {
            debouncedFetch(query);
        } else {
            setSuggestions([]);
        }
    }, [query, debouncedFetch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [containerRef]);

    const handleSelect = (airport) => {
        setQuery(`${airport.city} (${airport.iata})`);
        onSelect(airport);
        setSelectedIndex(-1); // Reset selected index after selection
        setShowSuggestions(false);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedIndex(-1); // Reset selected index on input change
        setShowSuggestions(true);
    };

    const handleKeyDown = (e) => {
        if (suggestions.length === 0) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSelect(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                break;
            default:
                // Do nothing
                break;
        }
    };
    
    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <Input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={isInvalid ? 'border-red-500' : ''}
                    autoComplete="off"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                )}
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[9999] w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {suggestions.map((airport, index) => (
                        <div
                            key={`${airport.iata}-${index}`}
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blurring input on click
                                handleSelect(airport);
                            }}
                            className={`px-4 py-3 hover:bg-slate-100 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-b-0 ${
                                selectedIndex === index ? 'bg-blue-50' : ''
                            }`}
                        >
                            <Plane className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                               <p className="font-medium text-slate-800 truncate">{airport.name}</p>
                               <div className="flex items-center gap-2 mt-1">
                                   <span className="text-sm text-slate-500">{airport.city}, {airport.country}</span>
                                   <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{airport.iata}</span>
                               </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isLoading && (
                <div className="absolute z-[9999] w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 p-4 text-center text-slate-500">
                    No airports found for "{query}"
                </div>
            )}
        </div>
    );
}
