-- Migration 013: Co-Leadership System and Permissions

-- 1. Allow Leaders and Co-Leaders to update their community settings
DROP POLICY IF EXISTS "Leaders update community" ON public.communities;
CREATE POLICY "Leaders update community" ON public.communities FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE community_memberships.community_id = communities.id 
    AND community_memberships.user_id = auth.uid()::text 
    AND community_memberships.role IN ('Leader', 'Co-Leader')
  )
);

-- 2. Allow Leaders to promote/demote members (Update community_memberships)
-- A Leader or Co-Leader can update roles within their community.
CREATE POLICY "Leaders update memberships" ON public.community_memberships FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships as cm
    WHERE cm.community_id = community_memberships.community_id 
    AND cm.user_id = auth.uid()::text 
    AND cm.role IN ('Leader', 'Co-Leader')
  )
);

-- 3. Allow Leaders and Co-Leaders to create events
CREATE POLICY "Leaders create events" ON public.events FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE community_memberships.community_id = events.community_id 
    AND community_memberships.user_id = auth.uid()::text 
    AND community_memberships.role IN ('Leader', 'Co-Leader')
  )
);

-- 4. Allow Leaders and Co-Leaders to update events
CREATE POLICY "Leaders update events" ON public.events FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE community_memberships.community_id = events.community_id 
    AND community_memberships.user_id = auth.uid()::text 
    AND community_memberships.role IN ('Leader', 'Co-Leader')
  )
);

-- 5. Allow Leaders and Co-Leaders to create channels
CREATE POLICY "Leaders create channels" ON public.channels FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE community_memberships.community_id = channels.community_id 
    AND community_memberships.user_id = auth.uid()::text 
    AND community_memberships.role IN ('Leader', 'Co-Leader')
  )
);
