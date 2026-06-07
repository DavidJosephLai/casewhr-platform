import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// LINE OAuth config
const LINE_CHANNEL_ID = Deno.env.get('LINE_CHANNEL_ID');
const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET');
const LINE_CALLBACK_URL = Deno.env.get('LINE_CALLBACK_URL');

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Dev-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-215f78a5/health", (c) => {
  return c.json({ status: "ok" });
});

// ========================================
// Projects API
// ========================================

// GET /projects - Get all projects with filters
app.get("/make-server-215f78a5/projects", async (c) => {
  try {
    const status = c.req.query('status');
    const category = c.req.query('category');
    const required_skills = c.req.query('required_skills');
    const user_id = c.req.query('user_id');
    const sort_by = c.req.query('sort_by') || 'newest';
    const budget_min = c.req.query('budget_min');
    const budget_max = c.req.query('budget_max');
    const search_query = c.req.query('search_query');

    console.log('📋 [GET /projects] Fetching projects with filters:', {
      status, category, required_skills, user_id, sort_by, budget_min, budget_max, search_query
    });

    // Get all projects from KV store
    let projects = await kv.getByPrefix('project:').catch(() => []);

    console.log('📋 [GET /projects] Raw projects from KV:', {
      count: projects.length,
      sample: projects[0]
    });

    // Filter out null/undefined values
    projects = projects.filter((p: any) => p != null && typeof p === 'object');

    console.log('📋 [GET /projects] After filtering null values:', {
      count: projects.length
    });

    // Apply filters
    if (status) {
      projects = projects.filter((p: any) => p?.status === status);
    }
    if (category) {
      projects = projects.filter((p: any) => p?.category === category);
    }
    if (user_id) {
      projects = projects.filter((p: any) => p?.user_id === user_id);
    }
    if (search_query) {
      const query = search_query.toLowerCase();
      projects = projects.filter((p: any) =>
        p?.title?.toLowerCase().includes(query) ||
        p?.description?.toLowerCase().includes(query)
      );
    }
    if (budget_min) {
      const min = parseFloat(budget_min);
      projects = projects.filter((p: any) =>
        (p?.budget_min && p.budget_min >= min) || (p?.budget_max && p.budget_max >= min)
      );
    }
    if (budget_max) {
      const max = parseFloat(budget_max);
      projects = projects.filter((p: any) =>
        (p?.budget_min && p.budget_min <= max) || (p?.budget_max && p.budget_max <= max)
      );
    }
    if (required_skills) {
      const skills = required_skills.split(',');
      projects = projects.filter((p: any) =>
        skills.some((skill: string) =>
          p?.required_skills?.includes(skill)
        )
      );
    }

    // Sort projects
    switch (sort_by) {
      case 'newest':
        projects.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'oldest':
        projects.sort((a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'budget_high':
        projects.sort((a: any, b: any) =>
          (b.budget_max || 0) - (a.budget_max || 0)
        );
        break;
      case 'budget_low':
        projects.sort((a: any, b: any) =>
          (a.budget_min || 0) - (b.budget_min || 0)
        );
        break;
    }

    // Get proposal counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project: any) => {
        const proposals = await kv.getByPrefix(`proposal:project:${project?.id || ''}`).catch(() => []);
        const validProposals = proposals.filter((p: any) => p != null && typeof p === 'object');
        const pending_proposals = validProposals.filter((p: any) => p?.status === 'pending');

        return {
          ...project,
          proposal_count: validProposals.length,
          pending_proposal_count: pending_proposals.length
        };
      })
    );

    console.log(`✅ [GET /projects] Returning ${projectsWithCounts.length} projects`);

    return c.json({
      projects: projectsWithCounts,
      total: projectsWithCounts.length
    });
  } catch (error) {
    console.error('❌ [GET /projects] Error:', error);
    return c.json({
      projects: [],
      error: 'Failed to fetch projects'
    }, 500);
  }
});

// GET /projects/:id - Get single project
app.get("/make-server-215f78a5/projects/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const project = await kv.get(`project:${id}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get proposal count
    const proposals = await kv.getByPrefix(`proposal:project:${id}`).catch(() => []);
    const validProposals = proposals.filter((p: any) => p != null && typeof p === 'object');
    const pending_proposals = validProposals.filter((p: any) => p?.status === 'pending');

    return c.json({
      ...project,
      proposal_count: validProposals.length,
      pending_proposal_count: pending_proposals.length
    });
  } catch (error) {
    console.error('❌ [GET /projects/:id] Error:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// POST /projects - Create new project
app.post("/make-server-215f78a5/projects", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');

    // Extract user_id from token (simplified - in production use JWT)
    const user_id = devToken || authHeader?.replace('Bearer ', '');

    const body = await c.req.json();
    const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const project = {
      id,
      user_id,
      title: body.title,
      description: body.description,
      budget_min: body.budget_min || null,
      budget_max: body.budget_max || null,
      deadline: body.deadline || null,
      required_skills: body.required_skills || [],
      category: body.category || null,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`project:${id}`, project);

    console.log('✅ [POST /projects] Project created:', id);
    return c.json(project, 201);
  } catch (error) {
    console.error('❌ [POST /projects] Error:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// PUT /projects/:id - Update project
app.put("/make-server-215f78a5/projects/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await kv.get(`project:${id}`);
    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updated = {
      ...existing,
      ...body,
      id, // Ensure ID doesn't change
      updated_at: new Date().toISOString()
    };

    await kv.set(`project:${id}`, updated);

    console.log('✅ [PUT /projects/:id] Project updated:', id);
    return c.json(updated);
  } catch (error) {
    console.error('❌ [PUT /projects/:id] Error:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// DELETE /projects/:id - Delete project
app.delete("/make-server-215f78a5/projects/:id", async (c) => {
  try {
    const id = c.req.param('id');

    const existing = await kv.get(`project:${id}`);
    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }

    await kv.del(`project:${id}`);

    console.log('✅ [DELETE /projects/:id] Project deleted:', id);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [DELETE /projects/:id] Error:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

// ========================================
// Proposals API
// ========================================

// POST /proposals - Create proposal
app.post("/make-server-215f78a5/proposals", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    const user_id = devToken || authHeader?.replace('Bearer ', '');

    const body = await c.req.json();
    const id = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const proposal = {
      id,
      project_id: body.project_id,
      user_id,
      cover_letter: body.cover_letter,
      proposed_budget: body.proposed_budget,
      proposed_timeline: body.proposed_timeline,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`proposal:${id}`, proposal);
    await kv.set(`proposal:project:${body.project_id}:${id}`, proposal);
    await kv.set(`proposal:user:${user_id}:${id}`, proposal);

    console.log('✅ [POST /proposals] Proposal created:', id);
    return c.json(proposal, 201);
  } catch (error) {
    console.error('❌ [POST /proposals] Error:', error);
    return c.json({ error: 'Failed to create proposal' }, 500);
  }
});

// GET /proposals/project/:projectId - Get proposals for project
app.get("/make-server-215f78a5/proposals/project/:projectId", async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const proposals = await kv.getByPrefix(`proposal:project:${projectId}`).catch(() => []);

    return c.json({
      proposals
    });
  } catch (error) {
    console.error('❌ [GET /proposals/project/:projectId] Error:', error);
    return c.json({ error: 'Failed to fetch proposals' }, 500);
  }
});

// GET /proposals/user/:userId - Get proposals by user
app.get("/make-server-215f78a5/proposals/user/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const proposals = await kv.getByPrefix(`proposal:user:${userId}`).catch(() => []);

    return c.json({
      proposals
    });
  } catch (error) {
    console.error('❌ [GET /proposals/user/:userId] Error:', error);
    return c.json({ error: 'Failed to fetch proposals' }, 500);
  }
});

// PUT /proposals/:id - Update proposal
app.put("/make-server-215f78a5/proposals/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await kv.get(`proposal:${id}`);
    if (!existing) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    const updated = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString()
    };

    await kv.set(`proposal:${id}`, updated);
    await kv.set(`proposal:project:${updated.project_id}:${id}`, updated);
    await kv.set(`proposal:user:${updated.user_id}:${id}`, updated);

    console.log('✅ [PUT /proposals/:id] Proposal updated:', id);
    return c.json(updated);
  } catch (error) {
    console.error('❌ [PUT /proposals/:id] Error:', error);
    return c.json({ error: 'Failed to update proposal' }, 500);
  }
});

// ========================================
// Blog API
// ========================================

// GET /blog/posts - Get blog posts
app.get("/make-server-215f78a5/blog/posts", async (c) => {
  try {
    const limit = c.req.query('limit') || '10';
    const offset = c.req.query('offset') || '0';

    console.log('📝 [GET /blog/posts] Fetching blog posts');
    const allPosts = await kv.getByPrefix('blog:post:').catch(() => []);
    console.log('📝 [GET /blog/posts] Found posts:', allPosts.length);

    // Filter out null/undefined values and sort by date (newest first)
    const posts = allPosts
      .filter((p: any) => p != null && typeof p === 'object')
      .sort((a: any, b: any) =>
        new Date(b?.published_at || b?.created_at || 0).getTime() -
        new Date(a?.published_at || a?.created_at || 0).getTime()
      )
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    console.log(`✅ [GET /blog/posts] Returning ${posts.length} posts`);

    return c.json({
      posts,
      total: allPosts.length
    });
  } catch (error) {
    console.error('❌ [GET /blog/posts] Error:', error);
    return c.json({
      posts: [],
      error: 'Failed to fetch blog posts'
    }, 500);
  }
});

// GET /blog/posts/:slug - Get single blog post
app.get("/make-server-215f78a5/blog/posts/:slug", async (c) => {
  try {
    const slug = c.req.param('slug');
    const post = await kv.get(`blog:post:${slug}`);

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Get related posts (same category)
    const allPosts = await kv.getByPrefix('blog:post:').catch(() => []);
    const relatedPosts = (allPosts as any[])
      .filter((p: any) => p.slug !== slug && p.category === post.category && p.status === 'published')
      .slice(0, 3);

    return c.json({ post, relatedPosts });
  } catch (error) {
    console.error('❌ [GET /blog/posts/:slug] Error:', error);
    return c.json({ error: 'Failed to fetch blog post' }, 500);
  }
});

// POST /blog/posts - Create or update a blog post
app.post("/make-server-215f78a5/blog/posts", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    // Verify auth
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return c.json({ error: 'Unauthorized', message: 'Unauthorized' }, 401);
    }

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': anonKey || '' }
    });
    if (!userRes.ok) {
      return c.json({ error: 'Unauthorized', message: 'Unauthorized' }, 401);
    }
    const { id: userId, email: userEmail } = await userRes.json();

    const body = await c.req.json();
    const { slug, title, title_zh, title_cn } = body;

    if (!slug || (!title && !title_zh && !title_cn)) {
      return c.json({ error: 'Validation failed', message: 'Title and slug are required' }, 400);
    }

    const existing = await kv.get(`blog:post:${slug}`);
    const now = new Date().toISOString();

    const post = {
      ...body,
      slug,
      authorEmail: userEmail,
      updatedAt: now,
      ...(existing ? {} : { createdAt: now, views: 0 }),
    };

    await kv.set(`blog:post:${slug}`, post);
    console.log(`✅ [POST /blog/posts] Saved post: ${slug} by ${userEmail}`);
    return c.json({ success: true, post });
  } catch (error) {
    console.error('❌ [POST /blog/posts] Error:', error);
    return c.json({ error: 'Failed to save post', message: String(error) }, 500);
  }
});

// DELETE /blog/posts/:slug - Delete a blog post
app.delete("/make-server-215f78a5/blog/posts/:slug", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return c.json({ error: 'Unauthorized' }, 401);

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': anonKey || '' }
    });
    if (!userRes.ok) return c.json({ error: 'Unauthorized' }, 401);
    const { email: userEmail } = await userRes.json();

    const slug = c.req.param('slug');
    const post = await kv.get(`blog:post:${slug}`);
    if (!post) return c.json({ error: 'Post not found' }, 404);

    await kv.del(`blog:post:${slug}`);
    console.log(`✅ [DELETE /blog/posts/${slug}] Deleted by ${userEmail}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [DELETE /blog/posts/:slug] Error:', error);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// ========================================
// Freelancers/Talents API
// ========================================

// GET /freelancers - Get all freelancers
app.get("/make-server-215f78a5/freelancers", async (c) => {
  try {
    const skills = c.req.query('skills');
    const category = c.req.query('category');
    const search = c.req.query('search');
    const sort_by = c.req.query('sort_by') || 'newest';
    const limit = c.req.query('limit') || '50';
    const offset = c.req.query('offset') || '0';

    console.log('👥 [GET /freelancers] Fetching freelancers with filters:', {
      skills, category, search, sort_by, limit, offset
    });

    // Get all profiles marked as freelancers
    const allProfiles = await kv.getByPrefix('profile:').catch(() => []);

    // Filter out null/undefined values and get freelancers
    let freelancers = allProfiles
      .filter((p: any) => p != null && typeof p === 'object')
      .filter((p: any) => p?.is_freelancer === true);

    // Apply filters
    if (skills) {
      const skillList = skills.split(',');
      freelancers = freelancers.filter((f: any) =>
        skillList.some((skill: string) =>
          f?.skills?.includes(skill)
        )
      );
    }

    if (category) {
      freelancers = freelancers.filter((f: any) =>
        f?.categories?.includes(category)
      );
    }

    if (search) {
      const query = search.toLowerCase();
      freelancers = freelancers.filter((f: any) =>
        f?.bio?.toLowerCase().includes(query) ||
        f?.title?.toLowerCase().includes(query) ||
        f?.skills?.some((s: string) => s?.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sort_by) {
      case 'newest':
        freelancers.sort((a: any, b: any) =>
          new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
        );
        break;
      case 'rating':
        freelancers.sort((a: any, b: any) =>
          (b?.rating || 0) - (a?.rating || 0)
        );
        break;
    }

    // Pagination
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedFreelancers = freelancers.slice(start, end);

    console.log(`✅ [GET /freelancers] Returning ${paginatedFreelancers.length} freelancers`);

    return c.json({
      freelancers: paginatedFreelancers,
      total: freelancers.length
    });
  } catch (error) {
    console.error('❌ [GET /freelancers] Error:', error);
    return c.json({
      freelancers: [],
      error: 'Failed to fetch freelancers'
    }, 500);
  }
});

// GET /freelancer/:id/profile - Get single freelancer profile (used by FreelancerProfile component)
app.get("/make-server-215f78a5/freelancer/:id/profile", async (c) => {
  try {
    const id = c.req.param('id');
    const profile = await kv.get(`profile:${id}`);

    if (!profile) {
      return c.json({ error: 'Freelancer not found' }, 404);
    }

    // Get portfolio
    const portfolioData = await kv.get(`portfolio:${id}`).catch(() => null);
    const portfolioItems = portfolioData?.portfolio_items || [];

    // Get reviews
    const reviews = await kv.getByPrefix(`review:user:${id}`).catch(() => []);

    return c.json({
      profile: {
        id: (profile as any).user_id || id,
        email: (profile as any).email,
        name: (profile as any).full_name,
        avatar: (profile as any).avatar_url,
        title: (profile as any).job_title,
        bio: (profile as any).bio,
        skills: (profile as any).skills || [],
        location: (profile as any).location,
        website: (profile as any).website,
        availability: (profile as any).availability,
        portfolio: portfolioItems,
        reviews: reviews.filter((r: any) => r != null),
        joined_date: (profile as any).created_at,
      }
    });
  } catch (error) {
    console.error('❌ [GET /freelancer/:id/profile] Error:', error);
    return c.json({ error: 'Failed to fetch freelancer profile' }, 500);
  }
});

// GET /freelancers/:id - Get single freelancer
app.get("/make-server-215f78a5/freelancers/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const profile = await kv.get(`profile:${id}`);

    if (!profile) {
      return c.json({ error: 'Freelancer not found' }, 404);
    }

    return c.json(profile);
  } catch (error) {
    console.error('❌ [GET /freelancers/:id] Error:', error);
    return c.json({ error: 'Failed to fetch freelancer' }, 500);
  }
});

// ========================================
// Reviews API
// ========================================

// POST /reviews - Create review
app.post("/make-server-215f78a5/reviews", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    const user_id = devToken || authHeader?.replace('Bearer ', '');

    const body = await c.req.json();
    const id = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const review = {
      id,
      reviewer_id: user_id,
      reviewee_id: body.reviewee_id,
      project_id: body.project_id,
      rating: body.rating,
      comment: body.comment,
      created_at: new Date().toISOString()
    };

    await kv.set(`review:${id}`, review);
    await kv.set(`review:user:${body.reviewee_id}:${id}`, review);

    console.log('✅ [POST /reviews] Review created:', id);
    return c.json(review, 201);
  } catch (error) {
    console.error('❌ [POST /reviews] Error:', error);
    return c.json({ error: 'Failed to create review' }, 500);
  }
});

// GET /reviews/user/:userId - Get reviews for user
app.get("/make-server-215f78a5/reviews/user/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const reviews = await kv.getByPrefix(`review:user:${userId}`).catch(() => []);

    return c.json({
      reviews
    });
  } catch (error) {
    console.error('❌ [GET /reviews/user/:userId] Error:', error);
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// ========================================
// Portfolio API
// ========================================

// GET /portfolio/:userId - Get user portfolio
app.get("/make-server-215f78a5/portfolio/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const portfolio = await kv.get(`portfolio:${userId}`);

    if (!portfolio) {
      return c.json({
        portfolio_items: []
      });
    }

    return c.json(portfolio);
  } catch (error) {
    console.error('❌ [GET /portfolio/:userId] Error:', error);
    return c.json({ error: 'Failed to fetch portfolio' }, 500);
  }
});

// PUT /portfolio/:userId - Update user portfolio
app.put("/make-server-215f78a5/portfolio/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();

    const portfolio = {
      user_id: userId,
      portfolio_items: body.portfolio_items || [],
      updated_at: new Date().toISOString()
    };

    await kv.set(`portfolio:${userId}`, portfolio);

    console.log('✅ [PUT /portfolio/:userId] Portfolio updated:', userId);
    return c.json(portfolio);
  } catch (error) {
    console.error('❌ [PUT /portfolio/:userId] Error:', error);
    return c.json({ error: 'Failed to update portfolio' }, 500);
  }
});

// ========================================
// Wismachion Trial License API
// ========================================

// Helper function to generate license key
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = 4;
  const segmentLength = 4;

  const key = [];
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    key.push(segment);
  }

  return `TRIAL-${key.join('-')}`;
}

// Helper function to send email via Brevo
async function sendTrialEmail(email: string, name: string, licenseKey: string, company?: string) {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY');

  if (!brevoApiKey) {
    console.error('❌ [Brevo] BREVO_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const emailData = {
    sender: {
      name: "Wismachion Soft & Tech",
      email: "noreply@casewhr.com"
    },
    to: [{ email, name }],
    subject: "🎉 Your PerfectComm 90-Day Trial License",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .license-box { background: white; border: 2px solid #4f46e5; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .license-key { font-size: 24px; font-weight: bold; color: #4f46e5; font-family: monospace; letter-spacing: 2px; }
          .features { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          ul { padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to PerfectComm!</h1>
            <p>Your 90-Day Free Trial is Ready</p>
          </div>
          <div class="content">
            <h2>Hi ${name}${company ? ` from ${company}` : ''},</h2>
            <p>Thank you for choosing PerfectComm! Your 90-day free trial has been activated.</p>
            <div class="license-box">
              <p style="margin: 0 0 10px 0; color: #64748b;">Your Trial License Key:</p>
              <div class="license-key">${licenseKey}</div>
              <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">Valid for 90 days from today</p>
            </div>
            <h3>🚀 Getting Started:</h3>
            <ol>
              <li>Download PerfectComm from <a href="https://wismachion.com">wismachion.com</a></li>
              <li>Install the software on your Windows machine</li>
              <li>Launch PerfectComm and enter your license key when prompted</li>
              <li>Start developing and testing your RS-232 communication protocols!</li>
            </ol>
            <div class="features">
              <h3>✨ What's Included in Your Trial:</h3>
              <ul>
                <li>Full RS-232/422/485 communication features</li>
                <li>Protocol development and testing tools</li>
                <li>USB to Wifi/Bluetooth/UHF transmission support</li>
                <li>Console Port control and management</li>
                <li>Universal Encoding Transform</li>
                <li>Email support during trial period</li>
              </ul>
            </div>
            <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            <p><strong>Best regards,</strong><br>
            Wismachion Soft & Tech Inc.<br>
            智訊科技</p>
            <div class="footer">
              <p>This email was sent to ${email}<br>
              © ${new Date().getFullYear()} Wismachion Soft & Tech Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log('📧 [Brevo] Sending trial email to:', email);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [Brevo] Email send failed:', result);
      throw new Error(`Email service error: ${result.message || 'Unknown error'}`);
    }

    console.log('✅ [Brevo] Email sent successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ [Brevo] Error sending email:', error);
    throw error;
  }
}

// POST /wismachion/trial - Create trial license
app.post("/make-server-215f78a5/wismachion/trial", async (c) => {
  try {
    const { email, name, company } = await c.req.json();

    console.log('🎁 [Trial API] Request received:', { email, name, company });

    // Validate input
    if (!email || !name) {
      console.error('❌ [Trial API] Missing required fields');
      return c.json({
        success: false,
        error: 'Email and name are required'
      }, 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ [Trial API] Invalid email format');
      return c.json({
        success: false,
        error: 'Invalid email format'
      }, 400);
    }

    // Generate license key
    const licenseKey = generateLicenseKey();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90); // 90 days trial

    // Store license in KV store
    const licenseData = {
      email,
      name,
      company: company || null,
      licenseKey,
      type: 'trial',
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      activations: 0,
      maxActivations: 1
    };

    await kv.set(`wismachion:license:${licenseKey}`, licenseData);
    await kv.set(`wismachion:user:${email}`, {
      email,
      name,
      company,
      licenses: [licenseKey],
      createdAt: new Date().toISOString()
    });

    console.log('✅ [Trial API] License created:', licenseKey);

    // Send email
    try {
      await sendTrialEmail(email, name, licenseKey, company);
      console.log('✅ [Trial API] Email sent successfully');
    } catch (emailError) {
      console.error('⚠️ [Trial API] Email send failed, but license created:', emailError);
      // Continue even if email fails
    }

    return c.json({
      success: true,
      licenseKey,
      expiresAt: expiryDate.toISOString(),
      message: 'Trial license created successfully'
    });

  } catch (error) {
    console.error('❌ [Trial API] Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create trial license'
    }, 500);
  }
});

// ========================================
// LINE OAuth Routes
// ========================================

// Helper: exchange LINE code for user + magic link
async function lineLoginFlow(code: string): Promise<{ magicLink: string; user: any; needsEmail: boolean }> {
  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !LINE_CALLBACK_URL) {
    throw new Error('LINE OAuth not configured: missing LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, or LINE_CALLBACK_URL env vars');
  }

  // Exchange code for token
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: LINE_CALLBACK_URL,
    client_id: LINE_CHANNEL_ID,
    client_secret: LINE_CHANNEL_SECRET,
  });
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  });
  if (!tokenRes.ok) throw new Error(`LINE token exchange failed: ${await tokenRes.text()}`);
  const tokenData = await tokenRes.json();

  // Get LINE profile
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) throw new Error(`LINE profile fetch failed: ${await profileRes.text()}`);
  const lineProfile = await profileRes.json();
  console.log('✅ [LINE Auth] Profile fetched:', lineProfile.userId);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const hasRealEmail = !!lineProfile.email;
  const email = lineProfile.email || `line_${lineProfile.userId}@casewhr.com`;

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  let user = users?.find((u: any) => u.user_metadata?.line_user_id === lineProfile.userId)
    ?? users?.find((u: any) => u.email === email);

  if (!user) {
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: {
        full_name: lineProfile.displayName, avatar_url: lineProfile.pictureUrl,
        line_user_id: lineProfile.userId, auth_provider: 'line',
        needs_email_update: !hasRealEmail,
      },
    });
    if (createErr || !newUser?.user) throw createErr || new Error('Failed to create user');
    user = newUser.user;
    await kv.set(`profile:${user.id}`, {
      user_id: user.id, email, full_name: lineProfile.displayName,
      avatar_url: lineProfile.pictureUrl || '', account_type: 'client',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).catch(() => {});
    console.log('✅ [LINE Auth] New user created:', user.id);
  } else {
    console.log('✅ [LINE Auth] Existing user found:', user.id);
  }

  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email!,
    options: { redirectTo: 'https://casewhr.com/?view=dashboard' },
  });
  if (linkErr || !linkData) throw linkErr || new Error('Failed to generate magic link');

  return {
    magicLink: linkData.properties.action_link,
    user,
    needsEmail: !hasRealEmail && (user.email as string)?.includes('@casewhr.com'),
  };
}

// GET /auth/line - Generate LINE auth URL
app.get("/make-server-215f78a5/auth/line", async (c) => {
  try {
    if (!LINE_CHANNEL_ID || !LINE_CALLBACK_URL) {
      console.error('❌ [LINE Auth] Missing LINE_CHANNEL_ID or LINE_CALLBACK_URL env vars');
      return c.json({ error: 'LINE OAuth not configured on server' }, 500);
    }
    const state = crypto.randomUUID();
    await kv.set(`line_oauth_state:${state}`, { createdAt: Date.now() }).catch(() => {});
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINE_CHANNEL_ID,
      redirect_uri: LINE_CALLBACK_URL,
      state,
      scope: 'profile openid email',
    });
    const authUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
    console.log('✅ [LINE Auth] Generated auth URL');
    return c.json({ authUrl });
  } catch (error) {
    console.error('❌ [LINE Auth] Error generating auth URL:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// GET /auth/line/callback - Server-side LINE callback (when LINE_CALLBACK_URL points to server)
app.get("/make-server-215f78a5/auth/line/callback", async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');
  if (error || !code) {
    console.error('❌ [LINE Auth] Callback error or missing code:', error);
    return c.redirect('https://casewhr.com/?error=line_auth_failed');
  }
  try {
    const { magicLink } = await lineLoginFlow(code);
    console.log('✅ [LINE Auth] Redirecting to magic link...');
    return c.redirect(magicLink);
  } catch (err) {
    console.error('❌ [LINE Auth] Callback failed:', err);
    return c.redirect(`https://casewhr.com/?error=line_auth_failed&msg=${encodeURIComponent(String(err))}`);
  }
});

// POST /auth/line/exchange-token - Frontend-side LINE callback exchange
app.post("/make-server-215f78a5/auth/line/exchange-token", async (c) => {
  try {
    const { code, state } = await c.req.json();
    console.log('🟢 [LINE Token Exchange] Request received:', { hasCode: !!code, hasState: !!state });

    if (!code) return c.json({ error: 'missing_parameters', message: 'Missing code parameter' }, 400);

    const { magicLink, user, needsEmail } = await lineLoginFlow(code);
    console.log('✅ [LINE Token Exchange] Login successful:', user.email);

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'LINE User',
        avatar_url: user.user_metadata?.avatar_url || '',
      },
      magic_link: magicLink,
      needsEmailUpdate: needsEmail,
    });
  } catch (error: any) {
    console.error('❌ [LINE Token Exchange] Error:', error);
    return c.json({ error: 'exchange_failed', message: error.message || 'Unknown error' }, 500);
  }
});

// POST /auth/line/update-email - Update LINE user's email
app.post("/make-server-215f78a5/auth/line/update-email", async (c) => {
  try {
    const { user_id, email } = await c.req.json();
    if (!user_id || !email) return c.json({ error: 'Missing user_id or email' }, 400);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check for email conflicts
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const conflict = users?.find((u: any) => u.email === email && u.id !== user_id);
    if (conflict) {
      return c.json({ error: 'email_in_use', message: 'This email is already registered with another account' }, 409);
    }

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      email, email_confirm: true,
      user_metadata: { needs_email_update: false },
    });
    if (updateErr) throw updateErr;

    // Update KV profile
    const profile = await kv.get(`profile:${user_id}`).catch(() => null);
    if (profile) {
      await kv.set(`profile:${user_id}`, { ...profile, email, updated_at: new Date().toISOString() }).catch(() => {});
    }

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink', email,
      options: { redirectTo: 'https://casewhr.com/?view=dashboard' },
    });
    if (linkErr || !linkData) throw linkErr || new Error('Failed to generate magic link');

    return c.json({ success: true, magicLink: linkData.properties.action_link });
  } catch (error: any) {
    console.error('❌ [LINE Update Email] Error:', error);
    return c.json({ error: error.message || 'Failed to update email' }, 500);
  }
});

Deno.serve(app.fetch);
