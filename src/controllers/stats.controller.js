const supabase = require('../services/supabase');

const statsController = {
  async getUserStats(req, res) {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.userId)
        .single();

      // Get word statistics
      const { data: wordStats } = await supabase
        .from('user_word_stats')
        .select('*')
        .eq('user_id', req.userId);

      // Get test statistics
      const { data: tests } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', req.userId)
        .eq('is_completed', true);

      // Get revision sessions
      const { data: revisions } = await supabase
        .from('revision_sessions')
        .select('*')
        .eq('user_id', req.userId);

      // Calculate statistics
      const totalWords = wordStats?.length || 0;
      const masteredWords = wordStats?.filter(w => w.is_mastered).length || 0;
      const favoriteWords = wordStats?.filter(w => w.is_favorite).length || 0;
      
      const totalTests = tests?.length || 0;
      const averageScore = totalTests > 0
        ? tests.reduce((sum, test) => sum + (test.score || 0), 0) / totalTests
        : 0;
      
      const perfectTests = tests?.filter(t => t.score === 100).length || 0;
      const totalRevisions = revisions?.length || 0;

      // Calculate learning streak
      const today = new Date().toISOString().split('T')[0];
      const hasActivityToday = wordStats?.some(w => 
        w.last_seen_date && w.last_seen_date.startsWith(today)
      ) || tests?.some(t => 
        t.started_at && t.started_at.startsWith(today)
      );

      res.json({
        profile: {
          ...profile,
          hasActivityToday
        },
        statistics: {
          words: {
            total: totalWords,
            mastered: masteredWords,
            favorites: favoriteWords,
            masteryRate: totalWords > 0 ? (masteredWords / totalWords) * 100 : 0
          },
          tests: {
            total: totalTests,
            averageScore: Math.round(averageScore),
            perfectTests,
            passRate: totalTests > 0 ? (tests.filter(t => t.score >= 70).length / totalTests) * 100 : 0
          },
          revisions: {
            total: totalRevisions,
            wordsReviewed: revisions?.reduce((sum, r) => sum + (r.words_reviewed || 0), 0) || 0
          },
          learning: {
            currentStreak: profile?.streak_days || 0,
            totalPoints: profile?.total_points || 0,
            currentLevel: profile?.current_level || 'A1'
          }
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getWordStats(req, res) {
    try {
      const { limit = 20, orderBy = 'times_seen', order = 'desc' } = req.query;

      const { data: wordStats } = await supabase
        .from('user_word_stats')
        .select(`
          *,
          words (spanish, russian, level_id, theme_id)
        `)
        .eq('user_id', req.userId)
        .order(orderBy, { ascending: order === 'asc' })
        .limit(limit);

      res.json({
        words: wordStats || [],
        orderBy,
        order
      });
    } catch (error) {
      console.error('Get word stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getProgress(req, res) {
    try {
      // Get progress by level
      const { data: levelProgress } = await supabase
        .from('user_level_progress')
        .select('*')
        .eq('user_id', req.userId)
        .order('level');

      // Get recent activity
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: recentTests } = await supabase
        .from('tests')
        .select('started_at, score')
        .eq('user_id', req.userId)
        .eq('is_completed', true)
        .gte('started_at', oneWeekAgo.toISOString())
        .order('started_at');

      const { data: recentRevisions } = await supabase
        .from('revision_sessions')
        .select('started_at, words_reviewed')
        .eq('user_id', req.userId)
        .gte('started_at', oneWeekAgo.toISOString())
        .order('started_at');

      // Group activity by day
      const dailyActivity = {};
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = days[date.getDay()];
        
        dailyActivity[dayName] = {
          date: dateStr,
          tests: recentTests?.filter(t => t.started_at.startsWith(dateStr)).length || 0,
          wordsReviewed: recentRevisions
            ?.filter(r => r.started_at.startsWith(dateStr))
            .reduce((sum, r) => sum + (r.words_reviewed || 0), 0) || 0
        };
      }

      res.json({
        levelProgress: levelProgress || [],
        weeklyActivity: dailyActivity,
        summary: {
          testsThisWeek: recentTests?.length || 0,
          wordsReviewedThisWeek: recentRevisions?.reduce((sum, r) => sum + (r.words_reviewed || 0), 0) || 0,
          averageScoreThisWeek: recentTests?.length > 0
            ? recentTests.reduce((sum, t) => sum + (t.score || 0), 0) / recentTests.length
            : 0
        }
      });
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getAchievements(req, res) {
    try {
      // Get user's achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', req.userId)
        .order('earned_at', { ascending: false });

      // Get all available achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('points');

      // Check for new achievements
      const earnedIds = userAchievements?.map(ua => ua.achievement_id) || [];
      const availableAchievements = allAchievements?.filter(a => !earnedIds.includes(a.id)) || [];

      // Check if user qualifies for any new achievements
      const { data: stats } = await supabase
        .from('user_word_stats')
        .select('*')
        .eq('user_id', req.userId);

      const newAchievements = [];
      for (const achievement of availableAchievements) {
        const criteria = achievement.criteria;
        let qualified = false;

        if (criteria.words_learned && stats?.length >= criteria.words_learned) {
          qualified = true;
        }
        // Add more criteria checks as needed

        if (qualified) {
          newAchievements.push(achievement);
          // Award the achievement
          await supabase
            .from('user_achievements')
            .insert([{
              user_id: req.userId,
              achievement_id: achievement.id
            }]);
        }
      }

      res.json({
        earned: userAchievements || [],
        available: availableAchievements,
        newlyEarned: newAchievements,
        totalPoints: userAchievements?.reduce((sum, ua) => sum + (ua.achievements?.points || 0), 0) || 0
      });
    } catch (error) {
      console.error('Get achievements error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = statsController;