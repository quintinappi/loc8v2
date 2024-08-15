export async function getClockingData(userId) {
    // Replace with your actual API endpoint and logic
    const response = await fetch(`/api/clockingData?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch clocking data');
    }
    return await response.json();
  }