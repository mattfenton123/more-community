with open('investor-deck.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Slide 8B Content
old_8b = """        <!-- Back screen (Community) -->
        <div style="position:absolute;right:3%;top:12%;width:62%;height:380px;background:#020617;border-radius:12px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);transform:perspective(1000px) rotateY(-15deg) scale(0.9);opacity:0.6;transition:all 0.5s ease;display:flex;flex-direction:column">
          <!-- Mock Header -->
          <div style="height:120px;background:url('images/heroes/tw-yoga-collective.png') center/cover;position:relative">
            <div style="position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(transparent, #020617)"></div>
          </div>
          <!-- Mock Body -->
          <div style="padding:1rem;flex:1">
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem;color:#fff;margin-bottom:0.25rem">Mindful Miles</div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:0.65rem;color:#94a3b8;margin-bottom:1rem">1.2k Members • Tunbridge Wells</div>
            <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
              <div style="flex:1;background:#0f766e;color:#fff;border-radius:6px;padding:0.4rem;text-align:center;font-size:0.65rem;font-weight:600">Joined</div>
              <div style="flex:1;background:rgba(255,255,255,0.05);color:#fff;border-radius:6px;padding:0.4rem;text-align:center;font-size:0.65rem;font-weight:600">Chat</div>
            </div>
            <div style="font-family:'Syne',sans-serif;font-size:0.8rem;color:#fff;margin-bottom:0.5rem">Upcoming Events</div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:0.75rem;display:flex;gap:0.75rem;align-items:center">
              <div style="width:40px;height:40px;background:rgba(45,212,191,0.1);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#2dd4bf">
                <span style="font-size:0.55rem;font-weight:700;text-transform:uppercase">Oct</span>
                <span style="font-size:0.85rem;font-weight:700;line-height:1">12</span>
              </div>
              <div>
                <div style="font-family:'Syne',sans-serif;font-size:0.75rem;color:#fff">Morning Walk & Coffee</div>
                <div style="font-size:0.6rem;color:#64748b;margin-top:0.15rem">Dunorlan Park • 9:00 AM</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Front screen (Discover) -->
        <div style="position:absolute;left:3%;top:20%;width:62%;height:400px;background:#020617;border-radius:12px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.15);transform:perspective(1000px) rotateY(10deg);transition:all 0.5s ease;z-index:2;display:flex;flex-direction:column">
          <!-- Mock Header -->
          <div style="padding:1.25rem 1rem 0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;align-items:center">
            <div style="font-family:'Instrument Serif',serif;font-style:italic;font-size:1.4rem;color:#fff;line-height:1">more</div>
            <div style="width:24px;height:24px;border-radius:50%;background:#0f766e;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:bold;color:#fff">M</div>
          </div>
          <!-- Mock Body -->
          <div style="padding:1rem;flex:1;overflow:hidden">
            <div style="font-family:'Syne',sans-serif;font-size:1rem;color:#fff;margin-bottom:0.75rem">Discover Local</div>
            
            <!-- Feed Card 1 -->
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;overflow:hidden;margin-bottom:1rem">
              <div style="height:90px;background:url('images/heroes/tw-creative-collective.png') center/cover"></div>
              <div style="padding:0.75rem">
                <div style="display:inline-block;padding:0.15rem 0.4rem;background:rgba(251,191,36,0.1);color:#fbbf24;font-size:0.55rem;border-radius:4px;font-weight:700;text-transform:uppercase;margin-bottom:0.35rem;font-family:'Syne',sans-serif">Community</div>
                <div style="font-family:'Syne',sans-serif;font-size:0.8rem;color:#fff">Creative Collective</div>
                <div style="font-size:0.65rem;color:#94a3b8;margin-top:0.15rem">A space for local artists and makers.</div>
              </div>
            </div>
            
            <!-- Feed Card 2 -->
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;overflow:hidden">
              <div style="height:90px;background:url('images/heroes/mindful-miles.png') center/cover"></div>
              <div style="padding:0.75rem">
                <div style="display:inline-block;padding:0.15rem 0.4rem;background:rgba(45,212,191,0.1);color:#2dd4bf;font-size:0.55rem;border-radius:4px;font-weight:700;text-transform:uppercase;margin-bottom:0.35rem;font-family:'Syne',sans-serif">Event</div>
                <div style="font-family:'Syne',sans-serif;font-size:0.8rem;color:#fff">Sunset Run & Chat</div>
                <div style="font-size:0.65rem;color:#94a3b8;margin-top:0.15rem">Tonight • 6:30 PM</div>
              </div>
            </div>
          </div>
        </div>"""

new_8b = """        <!-- Back screen (Community Profile) -->
        <div style="position:absolute;right:3%;top:12%;width:62%;height:380px;background:#020617;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);transform:perspective(1000px) rotateY(-15deg) scale(0.9);opacity:0.6;transition:all 0.5s ease;display:flex;flex-direction:column">
          <!-- Mock Header/Hero Image -->
          <div style="height:140px;background:url('images/heroes/tw-yoga-collective.png') center/cover;position:relative">
            <div style="position:absolute;bottom:0;left:0;right:0;height:70%;background:linear-gradient(transparent, #020617)"></div>
            <div style="position:absolute;bottom:12px;left:16px;right:16px;display:flex;justify-content:space-between;align-items:flex-end">
              <div>
                <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.2rem;color:#fff;line-height:1.1">Mindful Miles</div>
                <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:0.65rem;color:#94a3b8;margin-top:4px">Tunbridge Wells • 1.2k Members</div>
              </div>
              <div style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </div>
            </div>
          </div>
          <!-- Mock Body -->
          <div style="padding:16px;flex:1">
            <div style="display:flex;gap:8px;margin-bottom:16px">
              <div style="flex:1;background:rgba(20, 184, 166, 0.15);color:#2dd4bf;border:1px solid rgba(20,184,166,0.3);border-radius:12px;padding:8px;text-align:center;font-size:0.75rem;font-weight:600">Joined</div>
              <div style="flex:1;background:rgba(255,255,255,0.05);color:#fff;border-radius:12px;padding:8px;text-align:center;font-size:0.75rem;font-weight:600">Chat</div>
            </div>
            
            <div style="display:flex;gap:12px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:16px;padding-bottom:8px">
              <div style="font-size:0.75rem;font-weight:600;color:#fff;position:relative">About<div style="position:absolute;bottom:-9px;left:0;right:0;height:2px;background:#2dd4bf;border-radius:2px"></div></div>
              <div style="font-size:0.75rem;font-weight:600;color:#64748b">Events (3)</div>
              <div style="font-size:0.75rem;font-weight:600;color:#64748b">Members</div>
            </div>
            
            <div style="font-family:'Syne',sans-serif;font-size:0.85rem;color:#fff;margin-bottom:8px">Upcoming Event</div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:16px;padding:12px;display:flex;gap:12px;align-items:center">
              <div style="width:45px;height:45px;background:rgba(45,212,191,0.1);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#2dd4bf">
                <span style="font-size:0.6rem;font-weight:700;text-transform:uppercase">Oct</span>
                <span style="font-size:1rem;font-weight:800;line-height:1">12</span>
              </div>
              <div style="flex:1">
                <div style="font-family:'Syne',sans-serif;font-size:0.85rem;color:#fff;font-weight:600">Morning Walk & Coffee</div>
                <div style="font-size:0.65rem;color:#94a3b8;margin-top:4px;display:flex;align-items:center;gap:4px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Dunorlan Park
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Front screen (Discover) -->
        <div style="position:absolute;left:3%;top:20%;width:62%;height:400px;background:#020617;border-radius:24px;overflow:hidden;box-shadow:0 30px 60px -15px rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.15);transform:perspective(1000px) rotateY(10deg);transition:all 0.5s ease;z-index:2;display:flex;flex-direction:column">
          <!-- Mock Header -->
          <div style="padding:16px 20px 12px;display:flex;justify-content:space-between;align-items:center">
            <div style="font-family:'Instrument Serif',serif;font-style:italic;font-size:1.8rem;color:#fff;line-height:1;margin-top:-4px">more</div>
            <div style="display:flex;gap:12px;align-items:center">
              <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              </div>
            </div>
          </div>
          
          <!-- Pills -->
          <div style="padding:0 20px;display:flex;gap:8px;margin-bottom:16px;overflow:hidden">
            <div style="padding:6px 16px;background:rgba(20,184,166,0.15);color:#2dd4bf;border:1px solid rgba(20,184,166,0.3);border-radius:100px;font-size:0.7rem;font-weight:600">Communities</div>
            <div style="padding:6px 16px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid transparent;border-radius:100px;font-size:0.7rem;font-weight:600">Events</div>
            <div style="padding:6px 16px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid transparent;border-radius:100px;font-size:0.7rem;font-weight:600">Experiences</div>
          </div>
          
          <!-- Mock Body -->
          <div style="padding:0 20px 16px;flex:1;overflow:hidden">
            
            <!-- Featured Community -->
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:20px;overflow:hidden;position:relative;height:140px;margin-bottom:12px">
              <img src="images/heroes/tw-creative-collective.png" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">
              <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(2,6,23,0.9), rgba(2,6,23,0) 60%)"></div>
              <div style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);padding:4px 10px;border-radius:8px;display:flex;align-items:center;gap:4px">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span style="color:#fff;font-size:0.55rem;font-weight:700;text-transform:uppercase;letter-spacing:1px">Featured</span>
              </div>
              <div style="position:absolute;bottom:12px;left:12px;right:12px">
                <div style="font-family:'Syne',sans-serif;font-size:1.1rem;color:#fff;font-weight:700">Creative Collective</div>
                <div style="font-size:0.65rem;color:#cbd5e1;margin-top:2px">A space for local artists and makers.</div>
              </div>
            </div>
            
            <!-- Standard Community Card -->
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:16px;overflow:hidden;display:flex;height:85px">
              <div style="width:85px;height:100%;background:url('images/heroes/tw-good-neighbours.png') center/cover"></div>
              <div style="padding:12px;flex:1;display:flex;flex-direction:column;justify-content:center">
                <div style="font-family:'Syne',sans-serif;font-size:0.85rem;color:#fff;font-weight:700">Good Neighbours</div>
                <div style="font-size:0.6rem;color:#94a3b8;margin-top:4px">Community volunteering and support.</div>
                <div style="display:flex;align-items:center;gap:4px;margin-top:6px;font-size:0.55rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> 850 Members
                </div>
              </div>
            </div>
          </div>
          
          <!-- Mock Tab Bar -->
          <div style="height:60px;background:rgba(15,23,42,0.9);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-around;padding:0 10px;position:relative;z-index:10">
            <!-- Discover (Active) -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#2dd4bf">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
              <span style="font-size:0.55rem;font-weight:600">Discover</span>
            </div>
            <!-- Groups -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#64748b">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span style="font-size:0.55rem;font-weight:600">Groups</span>
            </div>
            <!-- Create/Lead -->
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:-20px">
              <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg, #14b8a6, #2dd4bf);box-shadow:0 8px 16px rgba(20,184,166,0.3);display:flex;align-items:center;justify-content:center;color:#fff;border:4px solid #020617">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
            </div>
            <!-- Events -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#64748b">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span style="font-size:0.55rem;font-weight:600">Events</span>
            </div>
            <!-- Profile -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#64748b">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span style="font-size:0.55rem;font-weight:600">Profile</span>
            </div>
          </div>
        </div>"""

old_11 = """<div class="slide" id="s11">
  <div class="eyebrow anim-1">Traction</div>
  <h2 class="disp anim-2" style="font-size:clamp(1.8rem,3vw,2.6rem);margin-top:.25rem">More than an idea. <span class="grad">Already delivering.</span></h2>
  <div class="traction-grid anim-3">"""

new_11 = """<div class="slide" id="s11">
  <div class="eyebrow anim-1">Traction</div>
  <h2 class="disp anim-2" style="font-size:clamp(1.8rem,3vw,2.6rem);margin-top:.25rem">More than an idea. <span class="grad">Already delivering.</span></h2>
  
  <div class="stat-row anim-3" style="gap:4rem;margin:1.75rem 0 2rem;justify-content:flex-start">
    <div class="stat"><div class="stat-num" style="font-size:2.5rem">12+</div><div class="stat-lbl" style="font-size:0.65rem;text-align:left">Active Communities<br>Onboarded</div></div>
    <div class="stat"><div class="stat-num" style="font-size:2.5rem">45+</div><div class="stat-lbl" style="font-size:0.65rem;text-align:left">Upcoming Events<br>Listed</div></div>
    <div class="stat"><div class="stat-num" style="font-size:2.5rem">300+</div><div class="stat-lbl" style="font-size:0.65rem;text-align:left">Waitlisted<br>Seekers</div></div>
  </div>

  <div class="traction-grid anim-4">"""

content = content.replace(old_8b, new_8b)
content = content.replace(old_11, new_11)

with open('investor-deck.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
