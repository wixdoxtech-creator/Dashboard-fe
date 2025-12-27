import { useState } from 'react';
import { MoreVertical, RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ContactNumber {
  id: string;
  severity: string;
  message: string;
  timestamp: string;
}

const INITIAL_DATA: ContactNumber[] = [
  {
    id: '1',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 09:06 pm',
  },
  {
    id: '2',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 09:04 pm',
  },
  {
    id: '3',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 08:42 am',
  },
  {
    id: '4',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 08:31 am',
  },
  {
    id: '5',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 08:13 am',
  },
  {
    id: '6',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 08:05 am',
  },
  {
    id: '7',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 07:21 am',
  },
  {
    id: '8',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 07:15 am',
  },
  {
    id: '9',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 07:00 am',
  },
  {
    id: '10',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 06:45 am',
  },
  {
    id: '11',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 06:30 am',
  },
  {
    id: '12',
    severity: 'High',
    message: 'This is a high severity notification',
    timestamp: '02/04/2025 06:15 am',
  },
];

export default function Notification() {
  const [numbers, setNumbers] = useState<ContactNumber[]>(INITIAL_DATA);
  const [selectedEntries, setSelectedEntries] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Handle window resize
  useState(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const entriesPerPage = parseInt(selectedEntries);
  const totalPages = Math.ceil(numbers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentNumbers = numbers.slice(startIndex, endIndex);

  const handleDelete = (id: string) => {
    setNumbers(numbers.filter(number => number.id !== id));
  };

  const handleDeleteAll = () => {
    setNumbers([]);
  };

  const handleRefresh = () => {
    setNumbers(INITIAL_DATA);
    setCurrentPage(1);
  };

//   const toggleStar = (id: string) => {
//     setNumbers(numbers.map(number => 
//       number.id === id ? { ...number, starred: !number.starred } : number
//     ));
//   };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleEntriesChange = (value: string) => {
    setSelectedEntries(value);
    setCurrentPage(1); // Reset to first page when changing entries per page
  };

  // Mobile view of contacts as cards
  const renderMobileView = () => (
    <div className="space-y-4">
      {currentNumbers.map((number) => (
        <div key={number.id} className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">{number.severity}</h3>
              <p className="text-sm text-gray-500">{number.message}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStar(number.id)}
                className="p-1"
              >
                <Star
                  className={`h-4 w-4 ${
                    number.starred ? 'fill-yellow-400 text-yellow-400' : ''
                  }`}
                />
              </Button> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDelete(number.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{number.timestamp}</span>
            <Button
              className="bg-red-600 hover:bg-red-700 text-xs"
              size="sm"
              onClick={() => handleDelete(number.id)}
            >
              Block
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 mb-10 bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className='text-2xl sm:text-3xl font-semibold'>Notification</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={handleDeleteAll}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Delete All</span>
          </Button>

          <Select value={selectedEntries} onValueChange={handleEntriesChange}>
            <SelectTrigger className="w-[120px] sm:w-[180px] text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Show 10 entries</SelectItem>
              <SelectItem value="25">Show 25 entries</SelectItem>
              <SelectItem value="50">Show 50 entries</SelectItem>
              <SelectItem value="100">Show 100 entries</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile View */}
      {isMobileView ? (
        renderMobileView()
      ) : (
        /* Desktop View */
        <div className="border rounded-lg bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox />
                </TableHead>
                {/* <TableHead className="w-[50px]">Starred</TableHead> */}
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentNumbers.map((number) => (
                <TableRow key={number.id} className='hover:bg-gray-100'>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  {/* <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStar(number.id)}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          number.starred ? 'fill-yellow-400 text-yellow-400' : ''
                        }`}
                      />
                    </Button>
                  </TableCell> */}
                  <TableCell>{number.severity}</TableCell>
                  <TableCell>{number.message}</TableCell>
                  <TableCell>
                    <Button
                      className='bg-red-600 hover:bg-red-700  cursor-pointer'
                      size="sm"
                      onClick={() => handleDelete(number.id)}
                    >
                      Block
                    </Button>
                  </TableCell>
                  <TableCell>{number.timestamp}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDelete(number.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, numbers.length)} of {numbers.length} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="text-xs sm:text-sm"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="text-xs sm:text-sm"
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
