#pragma once

namespace Blizzard::Net::Warcraft3::Statistics
{
//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//C# TO C++ CONVERTER NOTE: The following .NET attribute has no direct equivalent in C++:
//ORIGINAL LINE: [StructLayout(LayoutKind.Sequential, Pack = 1)] public unsafe struct BuildQueueInfo
//	public unsafe struct BuildQueueInfo
//	{
//		public const int MAX_NAME_LENGTH = 100;
//
//		public const int MAX_BUTTON_ART_LENGTH = 100;
//
//		public const int SIZE = sizeof(uint) + MAX_NAME_LENGTH * sizeof(byte) + sizeof(uint) + sizeof(BuildQueueType) + MAX_BUTTON_ART_LENGTH * sizeof(byte);
//
//		public readonly uint Id;
//
//		[MarshalAs(UnmanagedType.ByValTStr, SizeConst = MAX_NAME_LENGTH)] private fixed byte name[MAX_NAME_LENGTH];
//
//		public readonly uint TrainingProgress;
//
//		public readonly BuildQueueType Type;
//
//		[MarshalAs(UnmanagedType.ByValTStr, SizeConst = MAX_BUTTON_ART_LENGTH)] private fixed byte buttonArt[MAX_BUTTON_ART_LENGTH];
//
//		public string Name
//		{
//			get
//			{
//				fixed (byte * pName = this.name)
//				{
//					return Marshal.PtrToStringAnsi(new IntPtr(pName));
//				}
//			}
//		}
//
//		public string ButtonArt
//		{
//			get
//			{
//				fixed (byte * pButtonArt = this.buttonArt)
//				{
//					return Marshal.PtrToStringAnsi(new IntPtr(pButtonArt));
//				}
//			}
//		}
//	}
}
