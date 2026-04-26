#include "W3Ability.h"
#include "W3API.h"


bool w3api::W3Ability::IsHeroSkill() const {
	std::string& rId = GetStringId();
	return $.IsHeroAbility != 0 && isupper(rId[1]) && rId[0] != 'B';
}

UINT64 w3api::W3Ability::CalculateChangeDetectionHash() {
	bool IsCurrentlyActive = $.CooldownRemaining > 0;
	if (!m_IsCurrentlyActive && IsCurrentlyActive) {
		m_LastActivation = W3API::GetAPI()->Game->GameTime - (($.Cooldown - $.CooldownRemaining) * 1000);//
	}

	m_IsCurrentlyActive = IsCurrentlyActive;
	union SHashTemplate {
		UINT64 Hash;
		struct {
			int lastActivation;
			int ident;

		}Details;
	} H;
	H.Details.ident = $.Id + $.Level;
	H.Details.lastActivation = m_LastActivation;
	return H.Hash;
}
nlohmann::json w3api::W3Ability::SerializeChanges() const
{
	nlohmann::json serialized;
	serialized["class"] = "W3Skill";
	serialized["type"] = GetStringId();
	serialized["level"] = $.Level;
	serialized["lastActivation"] = m_LastActivation;
	return serialized;
}
;