import React, { useState } from 'react';
import { Upload, TrendingUp, Users, Heart, MessageCircle, Share2, Eye, BarChart3, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const InstagramAnalytics = () => {
  const [data, setData] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('engagement');
  const [selectedPost, setSelectedPost] = useState(null);

// Parse CSV data with better error handling
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file appears to be empty or invalid');
      return [];
    }
    
    // Parse headers and clean them
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    console.log('CSV Headers:', headers);
    
    const posts = lines.slice(1).map((line, index) => {
      // Handle commas within quoted fields
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      
      const post = {};
      headers.forEach((header, i) => {
        post[header] = values[i] || '';
      });
      
      // Parse numbers - handle both with and without commas
      const parseNumber = (val) => {
        if (!val) return 0;
        // Remove commas and parse
        return parseInt(String(val).replace(/,/g, '')) || 0;
      };
      
      // Map to your actual column names (lowercase)
      post.Likes = parseNumber(post.likes);
      post.Comments = parseNumber(post.comments);
      post.Shares = parseNumber(post.shares);
      post.Saves = parseNumber(post.saves);
      post.Reach = parseNumber(post.reach);
      post.Impressions = parseNumber(post.impressions);
      post.engagement = post.Likes + post.Comments + post.Shares + post.Saves;
      post.engagementRate = post.Reach > 0 ? ((post.engagement / post.Reach) * 100).toFixed(2) : 0;
      
      // Map media_type to Type and capitalize first letter
      const mediaType = post.media_type || post.type || 'Unknown';
      post.Type = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
      
      // Get caption from caption_length or other fields
      post.Caption = post.caption || post.Caption || 'No caption';
      
      return post;
    });
    
    console.log('Parsed posts:', posts.slice(0, 3)); // Log first 3 posts for debugging
    return posts;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const posts = parseCSV(event.target.result);
        setData(posts);
      };
      reader.readAsText(file);
    }
  };

  const getFilteredData = () => {
    if (!data) return [];
    
    let filtered = filterType === 'all' 
      ? data 
      : data.filter(post => post.Type?.toLowerCase() === filterType.toLowerCase());
    
    return filtered.sort((a, b) => {
      switch(sortBy) {
        case 'engagement':
          return b.engagement - a.engagement;
        case 'reach':
          return b.Reach - a.Reach;
        case 'engagementRate':
          return parseFloat(b.engagementRate) - parseFloat(a.engagementRate);
        default:
          return 0;
      }
    });
  };

  const calculateSummary = () => {
    if (!data || data.length === 0) return null;
    
    const totalLikes = data.reduce((sum, post) => sum + post.Likes, 0);
    const totalComments = data.reduce((sum, post) => sum + post.Comments, 0);
    const totalShares = data.reduce((sum, post) => sum + post.Shares, 0);
    const totalReach = data.reduce((sum, post) => sum + post.Reach, 0);
    const totalEngagement = data.reduce((sum, post) => sum + post.engagement, 0);
    const avgEngagementRate = (data.reduce((sum, post) => sum + parseFloat(post.engagementRate), 0) / data.length).toFixed(2);
    
    return {
      totalPosts: data.length,
      totalLikes,
      totalComments,
      totalShares,
      totalReach,
      totalEngagement,
      avgEngagementRate
    };
  };

  const getEngagementByType = () => {
    if (!data) return [];
    
    const types = {};
    data.forEach(post => {
      const type = post.Type || 'Unknown';
      if (!types[type]) {
        types[type] = { type, engagement: 0, count: 0 };
      }
      types[type].engagement += post.engagement;
      types[type].count += 1;
    });
    
    return Object.values(types).map(t => ({
      ...t,
      avgEngagement: Math.round(t.engagement / t.count)
    }));
  };

  const getTopPerformers = () => {
    if (!data) return [];
    return [...data]
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10)
      .map(post => ({
        caption: post.Caption?.substring(0, 30) + '...' || 'No caption',
        engagement: post.engagement,
        reach: post.Reach,
        engagementRate: parseFloat(post.engagementRate)
      }));
  };

  const summary = calculateSummary();
  const filteredData = getFilteredData();

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Instagram Analytics Dashboard</h1>
            <p className="text-gray-600 mb-8">Upload your Instagram analytics CSV to visualize campaign performance</p>
            <label className="inline-block">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all font-semibold">
                Choose CSV File
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Campaign Analytics</h1>
          <button
            onClick={() => setData(null)}
            className="bg-white px-6 py-3 rounded-lg shadow hover:shadow-lg transition-all text-gray-700 font-medium"
          >
            Upload New CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Engagement</span>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{summary.totalEngagement.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">{summary.totalPosts} posts</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Reach</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{summary.totalReach.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Unique accounts</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Avg Engagement Rate</span>
              <BarChart3 className="w-5 h-5 text-pink-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{summary.avgEngagementRate}%</div>
            <div className="text-sm text-gray-500 mt-1">Per post</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Interactions</span>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{(summary.totalLikes + summary.totalComments).toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Likes + Comments</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Filter by Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="carousel">Carousel</option>
                <option value="reel">Reel</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="engagement">Total Engagement</option>
                <option value="reach">Reach</option>
                <option value="engagementRate">Engagement Rate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Engagement by Type */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Performance by Content Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getEngagementByType()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgEngagement" fill="#E1306C" name="Avg Engagement" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-4">
              This shows which content types drive the most engagement on average. Use this to optimize your content mix.
            </p>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Top Performing Posts</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTopPerformers().slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="caption" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="engagement" fill="#833AB4" name="Engagement" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-4">
              Your top 5 posts by engagement. Analyze what made these successful to replicate results.
            </p>
          </div>
        </div>

        {/* Post Details Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Post Performance Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Caption</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Reach</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Engagement</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 10).map((post, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => setSelectedPost(post)}
                    className="border-b border-gray-100 hover:bg-purple-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 max-w-xs truncate">{post.Caption || 'No caption'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {post.Type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{post.Reach.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-semibold">{post.engagement.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-semibold">{post.engagementRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Post Modal */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPost(null)}>
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Post Details</h2>
              <div className="space-y-3">
                <p className="text-gray-700"><strong>Caption:</strong> {selectedPost.Caption}</p>
                <p className="text-gray-700"><strong>Type:</strong> {selectedPost.Type}</p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="font-semibold">Likes</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedPost.Likes.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold">Comments</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedPost.Comments.toLocaleString()}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="w-5 h-5 text-green-500" />
                      <span className="font-semibold">Shares</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedPost.Shares.toLocaleString()}</div>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-pink-500" />
                      <span className="font-semibold">Reach</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedPost.Reach.toLocaleString()}</div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
                    <span className="font-semibold">Engagement Rate: </span>
                    <span className="text-2xl font-bold text-purple-700">{selectedPost.engagementRate}%</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramAnalytics;